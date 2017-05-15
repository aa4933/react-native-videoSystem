/**
 * Created by wuilly on 2017/4/19.
 */

'use strict';

import React, {Component}  from  'react';
import Button from 'react-native-button';
import request from '../common/request';
import config from '../common/config';
import {
    StyleSheet,
    Text,
    View,
    TextInput,
    Alert,
} from 'react-native';

//var CountDownText = require('react-native-sk-countdown').CountDownText;
export default React.createClass({
    getInitialState(){
        return ({
            verifyCode: '',
            phoneNumber: '',
            codeSent: false,
            countingDone: false,

            //计时器
            count: 60,
        });
    },
    //计时器
    handleClick(){
        if (!this.state.codeSent) {
            this._sendVerifyCode();
            this.timer = setInterval(function () {
                var count = this.state.count;
                count -= 1;
                if (count < 1) {
                    //重置
                    this.setState({
                        codeSent: false
                    });
                    count = 60;
                    clearInterval(this.timer);
                }
                this.setState({
                    count: count
                });
            }.bind(this), 1000);
        }
    },
    //发送验证码
    _sendVerifyCode(){
        var phoneNumber = this.state.phoneNumber;
        if (!phoneNumber) {
            Alert.alert('不能为空');
        } else {
            var body = {
                phoneNumber: phoneNumber,
            };
            var signupURL = config.api.base + config.api.signup;
            request.post(signupURL, body)
                .then((data)=> {
                    if (data && data.success) {
                        console.log(data);
                        this._showVerifyCode();
                    } else {
                        Alert.alert('获取失败，请检查验证码是否正确');
                    }
                })
                .catch((err)=> {
                    Alert.alert('获取失败，请检查网络是否良好');
                })
        }
    },
    _showVerifyCode(){
        this.setState({
            codeSent: true,
        });
    },
    _submit(){

        var phoneNumber = this.state.phoneNumber;
        var verifyCode = this.state.verifyCode;
        if (!phoneNumber || !verifyCode) {
            Alert.alert('不能为空');
        } else {
            //登录
            var body = {
                phoneNumber: phoneNumber,
                verifyCode: verifyCode,
            };
            var signupURL = config.api.base + config.api.verify;
            request.post(signupURL, body)
                .then((data)=> {
                    if (data && data.success) {
                        //清除计时器
                        clearInterval(this.timer);
                        this.props.afterLogin(data.data);
                    } else {
                        Alert.alert('获取失败，请检查验证码是否正确');
                    }
                })
                .catch((err)=> {
                    Alert.alert('获取失败，请检查网络是否良好');
                })
        }
    },
    render: function () {
        return (
            <View style={styles.container}>
                <View style={styles.signupBox}>
                    <Text style={styles.title}>快速登录</Text>
                    <TextInput
                        style={styles.inputFieldPhone}
                        placeholder="请输入手机号"
                        autoCapitalize={'none'}
                        autoCorrect={false}
                        keyboardType={'number-pad'}
                        onChangeText={(text)=> {
                            this.setState({
                                phoneNumber: text,
                            });
                        }}
                    />
                    {
                        this.state.codeSent
                            ? <View style={styles.verifyCodeBox}>
                            <TextInput
                                style={styles.inputField}
                                placeholder="请输入验证码"
                                autoCapitalize={'none'}
                                autoCorrect={false}
                                keyboardType={'number-pad'}
                                onChangeText={(text)=> {
                                    this.setState({
                                        verifyCode: text,
                                    });
                                }}
                            />
                            <Text style={styles.countBtn}>{this.state.count + '秒后重置'}</Text>
                        </View>
                            : null
                    }
                    {
                        this.state.codeSent
                            ? <Button
                            style={styles.btn}
                            onPress={this._submit}>登录</Button>
                            : <Button
                            style={styles.btn}
                            onPress={this.handleClick}>获取验证码</Button>
                    }
                </View>
            </View>
        )
    }
});


const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 10,
        backgroundColor: '#F5FCFF',
    },
    title: {
        marginBottom: 20,
        color: '#333',
        fontSize: 20,
        textAlign: 'center',
    },
    signupBox: {
        marginTop: 30,
    },
    inputFieldPhone: {
        height: 40,
        borderColor: 'transparent',
        borderWidth: 1,
        borderRadius: 4,
        fontSize: 16,
        padding: 10,
        backgroundColor: '#fff',
    },
    inputField: {
        flex: 1,
        padding: 10,
        color: '#333',
        fontSize: 16,
        backgroundColor: '#fff',
        borderRadius: 4,
        height: 40,
    },
    btn: {
        marginTop: 10,
        padding: 10,
        backgroundColor: 'transparent',
        borderColor: '#ee735c',
        borderWidth: 1,
        borderRadius: 4,
        color: '#ee735c',
    },
    verifyCodeBox: {
        marginTop: 10,
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    countBtn: {
        width: 110,
        height: 40,
        padding: 10,
        marginLeft: 8,
        backgroundColor: '#ee735c',
        borderColor: '#ee735c',
        textAlign: 'center',
        fontSize: 15,
        borderRadius: 2,
        fontWeight: '600',
        color: '#fff',
    }
});