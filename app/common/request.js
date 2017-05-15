/**
 * Created by wuilly on 2017/3/31.
 */
'use strict'

import queryString from 'query-string';
import _ from  'lodash';
import Mock from 'mockjs';
import config from './config';

var request = {};

request.get=function(url,param){
    if (param){
        url += '?'+ queryString.stringify(param);
    }
    return fetch(url)
        .then((response) => response.json())
        .then((response) => Mock.mock(response))
}


request.post=function(url,body){
        var options=_.extend(config.header,{
            body: JSON.stringify(body)
        });
    return fetch(url,options)
        .then((response) => response.json())
        .then((response) => Mock.mock(response))
}

module.exports =request;
