/**
 * Created by wuilly on 2017/3/31.
 */
'use strict'

module.exports = {
    header: {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
        }
    },
    //上传信息
    qiniu:{
        upload :'http://up-z2.qiniu.com/',
        show:'http://opthvbkv3.bkt.clouddn.com/',
    },
    cloudinary :{
        cloud_name: 'wulihh',
        api_key: '712538933897591',
        api_secret: 'lTGDYyoH8sL6CDnYk-rgsDPEhiM',
        base: 'http://res.cloudinary.com/wulihh',
        image: 'https://api.cloudinary.com/v1_1/wulihh/image/upload',
        video: 'https://api.cloudinary.com/v1_1/wulihh/video/upload',
        audio: 'https://api.cloudinary.com/v1_1/wulihh/raw/upload',
    },
    //api路由
    api :{
        //base :'http://rap.taobao.org/mockjs/16041/',
        //base :'http://localhost:1234/',
        base:'http://192.168.1.178:1234/',
        creations:'api/creations',
        up:'api/up',
        video:'api/creations/video',
        audio:'api/creations/audio',
        comments:'api/comments',
        signup:'api/u/signup',
        verify:'api/u/verify',
        signature:'api/signature',
        update:'api/u/update',
    }
};