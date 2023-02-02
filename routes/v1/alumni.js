const express = require('express')
const router = express.Router()
const axios = require('axios')
const cheerio = require('cheerio')
const URL_ALUMNI = `${process.env.BASE_URL}alumni`

const getAlumni = async (page, cari, jurusan, prodi, angkatan, lulus) => {
    const url = `${URL_ALUMNI}${page ? `/page-${page}` : '/'}?cari=${cari ? cari : ''}&jurusan=${jurusan ? jurusan : ''}&prodi=${prodi ? prodi : ''}&angkatan=${angkatan ? angkatan : ''}&th_lulus=${lulus ? lulus : ''}`
    const response = await axios.get(url)
    const $ = cheerio.load(response.data)
    const alumniList = $('body .as-mainwrapper .about-area .container .row .col-md-6 .single-job-post')
    const paginationList = $('body .as-mainwrapper .about-area .container div div .pagination li')
    if (alumniList.length > 0) {
        const alumni = []
        alumniList.each(function (_index, element) {
            const $element = $(element)
            const image = $element.find('.img-icon img').toString().match(/src="(.*)" class/).pop()
            const nama = $element.find('.address h6').text().trim()
            const $elP = $element.find('.address p')
            const jurusan = $($elP[0]).text().trim()
            const prodi = $($elP[1]).text().trim()
            const lulusStr = $($elP[2]).text().replace('Tahun Lulus : ', '')
            const lulus = parseInt(lulusStr)
            const urlDetail = $element.find('.address div a').toString().match(/href="(.*)" class/).pop()
            const urlPath = '/v1/alumni/' + urlDetail.replace(`${URL_ALUMNI}/detail`, '').split('/')[1]
            alumni.push({
                image,
                nama,
                jurusan,
                prodi,
                lulus,
                urlPath
            })
        })

        const totalPageStr = paginationList ? $(paginationList[paginationList.length - 1]).find('a').toString() : undefined
        const totalPage = totalPageStr ? parseInt(totalPageStr.match(/page="(.*)">/).pop()) : undefined

        return {
            error: false,
            message: 'Alumni berhasil dimuat',
            data: alumni,
            currentPage: page ? parseInt(page) : 1,
            totalPage: totalPage ? totalPage : 1
        }
    } else {
        return {
            error: true,
            message: 'Alumni tidak ditemukan'
        }
    }
}

const getDetail = async (path) => {
    const url = `${URL_ALUMNI}/detail/${path}`
    const response = await axios.get(url)
    const $ = cheerio.load(response.data)
    const detailElement = $('body .as-mainwrapper .about-area .container div')
    const imgStr = $(detailElement[0]).find('center a img').toString()
    const trElement = $(detailElement[1]).find('div div table tbody tr')
    let nim = '', nama = '', jurusan = '', prodi = '', tahunMasuk = 0, tahunLulus = 0, ipk = 0
    if (imgStr && trElement.length > 0) {
        const img = imgStr.match(/src="(.*)" class/).pop()
        trElement.each(function (index, element) {
            const $element = $(element).find('td')
            const value = $($element[2]).text().trim()
            console.log(index + ': ' + value)
            index == 0 ? nim = value :
                index == 1 ? nama = value :
                    index == 2 ? jurusan = value :
                        index == 3 ? prodi = value :
                            index == 4 ? tahunMasuk = parseInt(value) :
                                index == 5 ? tahunLulus = parseInt(value) :
                                    index == 6 ? ipk = parseInt(value) : undefined
        })
        const data = { img, nim, nama, jurusan, prodi, tahunMasuk, tahunLulus, ipk }
        return {
            error: false,
            message: 'Alumni berhasil dimuat',
            data
        }
    } else {
        return {
            error: true,
            message: 'Alumni tidak ditemukan'
        }
    }
}

router.get('/', async function (req, res, next) {
    const page = req.query.page
    const cari = req.query.cari
    const jurusan = req.query.jurusan
    const prodi = req.query.prodi
    const angkatan = req.query.angkatan
    const lulus = req.query.lulus
    const data = await getAlumni(page, cari, jurusan, prodi, angkatan, lulus)
    res.json(data)
})

router.get('/:nim', async function (req, res, next) {
    const nim = req.params.nim
    const data = await getDetail(nim + '/jabirdev')
    res.json(data)
})

module.exports = router
