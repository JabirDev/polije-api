const express = require('express')
const router = express.Router()
const axios = require('axios')
const cheerio = require('cheerio')
const URL_LOKER = `${process.env.BASE_URL}lowongan`

const getLoker = async (page, cari) => {
  const url = `${URL_LOKER}${page ? `/page-${page}` : '/'}${cari ? `?cari=${cari}` : ''}`
  const response = await axios.get(url)
  const $ = cheerio.load(response.data)
  const jobsList = $('body .as-mainwrapper .blog-area .container .row .col-md-6 .single-job-post')
  const paginationList = $('body .as-mainwrapper .blog-area .container div .pagination li')

  if (jobsList.length > 0) {
    const jobs = []
    jobsList.each(function (_index, element) {
      const $element = $(element)
      const image = $element.find('.img-icon img').toString().match(/src="(.*)" class/).pop()
      const title = $element.find('.address h6').text()
      const $elPerusahaan = $element.find('.address p a')
      const urlPerusahaan = $elPerusahaan.toString().match(/href="(.*)"/).pop()
      const namaPerusahaan = $elPerusahaan.text()
      const deadline = $($element.find('p')[1]).text().replace('Deadline : ', '')
      const urlDetail = $element.find('.button-box a').toString().match(/href="(.*)" class/).pop()
      const urlPath = urlDetail.replace(`${URL_LOKER}/detail`, '')
      jobs.push({
        image,
        title,
        namaPerusahaan,
        urlPerusahaan,
        deadline,
        urlDetail
      })
    })

    const totalPageStr = paginationList ? $(paginationList[paginationList.length - 1]).find('a').toString() : undefined
    const totalPage = totalPageStr ? parseInt(totalPageStr.match(/page="(.*)">/).pop()) : undefined
    return {
      error: false,
      message: 'Lowongan pekerjaan berhasil dimuat',
      data: jobs,
      currentPage: page ? parseInt(page) : 1,
      totalPage: totalPage ? totalPage : 1
    }
  } else {
    return {
      error: true,
      message: 'Lowongan pekerjaan tidak ditemukan'
    }
  }
}

router.get('/', async function (req, res, next) {
  const page = req.query.page
  const cari = req.query.cari
  const data = await getLoker(page, cari)
  res.json(data)
})

module.exports = router
