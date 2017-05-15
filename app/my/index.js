/**
 * Created by wuilly on 2017/3/24.
 */

'use strict';

import React, {Component}  from  'react';
import request from '../common/request';
import config from '../common/config';
import * as Progress from 'react-native-progress';
import Button from 'react-native-button';
import {
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    Dimensions,
    Image,
    AsyncStorage,
    Alert,
    Modal,
    TextInput,
} from 'react-native';

var width = Dimensions.get('window').width;

//图像选择器配置
var ImagePicker = require('react-native-image-picker');
var photoOptions = {
    title: '选择头像',
    cancelButtonTitle: '取消',
    takePhotoButtonTitle: '拍照',
    chooseFromLibraryButtonTitle: '选择相册',
    noData: false,
    quality: 0.75,
    allowsEditing: true,
    storageOptions: {
        skipBackup: true,
        path: 'images'
    }
};

function avatar(id, type) {
    if (id.indexOf('http:') > -1) {
        return id;
    }
    if (id.indexOf('data:image') > -1) {
        return id;
    }
    if (id.indexOf('avatar/') > -1) {
        return config.cloudinary.base + '/' + type + '/upload/' + id
    }

    return 'http://opay4veqk.bkt.clouddn.com/' + id;

}
export default React.createClass({
    getInitialState(){
        var user = this.props.user || {};
        return {
            user: user,
            //上传
            avatarProgress: 0,
            avatarUploading: false,

            //modal
            modalVisible: false
        };
    },
    componentDidMount(){
        this._getAsyncStorage();
    },
    _edit(){
        this.setState({
            modalVisible: true
        });
    },
    _closeModal(){
        this.setState({
            modalVisible: false
        });
    },
    _logout(){
        this.props.logout();
    },
    _getQiniuToken(){
        var signatureURL = config.api.base + config.api.signature;
        var accessToken = this.state.user.accessToken;
        return request.post(signatureURL, {
            cloud: 'qiniu',
            type:'avatar',
            accessToken: accessToken,
        })
            .catch((e)=> {
                console.log(e);
            })
    },
    _imagePicker(){
        ImagePicker.showImagePicker(photoOptions, (response) => {

            if (response.didCancel) {
                return
            }


            //上传服务端
            var uri = response.uri;
//qiniu上传
            this._getQiniuToken()
                .then((data)=> {
                    if (data && data.success) {
                        //data.data即是需要的加密信息
                        let token = data.data.token;
                        let key = data.data.key;


                        var body = new FormData();
                        body.append("token", token);
                        body.append("key", key);
                        body.append("file", {
                            'type': 'image/png',
                            'uri': uri,
                            'name': key,
                        });

                        this._upload(body);
                    }
                })
//cloudinary上传
            /*
             var avatarData = 'data:image/jpeg;base64,' + response.data;
             request.post(signatureURL, {
             timestamp: timestamp,
             key: key,
             accessToken: accessToken,
             type: 'avatar',
             }).then((data)=> {
             if (data && data.success) {
             //data.data即是需要的加密信息

             //模拟后台操作
             let signature = data.data


             var body = new FormData();
             body.append("folder", folder);
             body.append("tags", tags);
             body.append("timestamp", timestamp);
             body.append("signature", signature);
             body.append("api_key", config.cloudinary.api_key);
             body.append("resource_type", 'image');
             body.append("file", avatarData);

             this._upload(body);
             }
             })
             .catch((e)=> {
             console.log(e);
             })
             */

        });
    },
    _upload(body){
        var xhr = new XMLHttpRequest();
        var url = config.qiniu.upload;

        this.setState({
            avatarUploading: true,
            avatarProgress: 0,
        });

        xhr.open('POST', url)
        xhr.onload = ()=> {

            if (xhr.status !== 200) {
                Alert.alert('请求失败');
                console.log(xhr.responseText);
                return
            }
            if (!xhr.responseText) {
                Alert.alert('请求失败');
                return
            }

            var response;

            try {
                response = JSON.parse(xhr.response);
            }
            catch (e) {
                console.log(e);
                console.log('parse fails');
            }
            console.log(response);

            if (response) {
                var user = this.state.user;
                if (response.public_id) {
                    user.avatar = response.public_id;
                }
                if (response.key) {
                    user.avatar = response.key;
                }
                this.setState({
                    user: user,
                    avatarUploading: false,
                    avatarProgress: 0,
                });
                this._asyncUser(true);
            }

        }


        //进度条事件
        if (xhr.upload) {
            xhr.upload.onprogress = (event)=> {
                if (event.lengthComputable) {
                    var percent = Number((event.loaded / event.total).toFixed(2) - 0.1);
                    console.log(percent);
                    this.setState({
                        avatarProgress: percent,
                    });

                }
            }
        }
        xhr.send(body);

    },
    _asyncUser(isAvatar){
        var user = this.state.user;

        if (user && user.accessToken) {
            var url = config.api.base + config.api.update;

            request.post(url, user)
                .then((data)=> {
                    if (data && data.success) {
                        var user = data.data;

                        if (isAvatar) {
                            Alert.alert('头像更新成功');
                        }
                        this.setState({
                            user: user,
                        }, ()=> {
                            this._closeModal();
                            AsyncStorage.setItem('user', JSON.stringify(user));
                        });
                    }
                })
        }
    },
    _getAsyncStorage(){
        AsyncStorage.getItem('user')
            .then((data)=> {
                var user;
                if (data) {
                    user = JSON.parse(data);
                }

                if (user && user.accessToken) {
                    this.setState({
                        user: user,
                    })
                }
            })
    },
    _changeUserState(key, value){
        var user = this.state.user;
        user[key] = value;
        this.setState({
            user: user,
        });
    },
    _submit(){
        this._asyncUser();
    },
    render: function () {
        var user = this.state.user;
        return (
            <View style={styles.container}>
                <View style={styles.toolbar}>
                    <Text style={styles.toolTitle}>我的账户</Text>
                    <Text style={styles.toolEdit} onPress={this._edit}>编辑</Text>
                </View>

                {
                    user.avatar
                        ?
                        <TouchableOpacity onPress={this._imagePicker} style={styles.avatarContainer}>
                            <Image style={styles.avatarContainer} source={{uri: avatar(user.avatar, 'image')}}>
                                <View style={styles.avatarBox}>
                                    {
                                        this.state.avatarUploading
                                            ?
                                            <Progress.Circle
                                                showsText={true}
                                                color={'#ee735c'}
                                                progress={this.state.avatarProgress}
                                                size={75}/>
                                            :
                                            <Image style={styles.avatar} source={{uri: avatar(user.avatar, 'image')}}/>
                                    }
                                </View>
                                <Text style={styles.avatarTip}>戳这里换头像</Text>
                            </Image>
                        </TouchableOpacity>
                        :
                        <TouchableOpacity onPress={this._imagePicker} style={styles.avatarContainer}>
                            <Text style={styles.avatarTip}>添加头像哦</Text>
                            <View style={styles.avatarBox}>
                                {
                                    this.state.avatarUploading
                                        ?
                                        <Progress.Circle
                                            showsText={true}
                                            color={'#ee735c'}
                                            progress={this.state.avatarProgress}
                                            size={75}/>
                                        :
                                        <Text style={[{fontFamily: 'iconfont'}, styles.plusIcon]}>&#xe600;</Text>
                                }
                            </View>
                        </TouchableOpacity>
                }

                <Modal
                    animationType={"slide"}
                    transparent={false}
                    visible={this.state.modalVisible}
                >
                    <View style={styles.modalContainer}>
                        <Text onPress={this._closeModal}
                              style={[{fontFamily: 'iconfont'}, styles.closeIcon]}>&#xe600;</Text>
                        <View style={styles.fieldItem}>
                            <Text style={styles.label}>昵称</Text>
                            <TextInput
                                placeholder={"输入你的昵称"}
                                style={styles.inputField}
                                autoCapitalize={'none'}
                                autoCorrect={false}
                                defaultValue={user.nickname}
                                onChangeText={(text)=> {
                                    this._changeUserState('nickname', text);
                                }}
                            />
                        </View>
                        <View style={styles.fieldItem}>
                            <Text style={styles.label}>种类</Text>
                            <TextInput
                                placeholder={"输入你的种类"}
                                style={styles.inputField}
                                autoCapitalize={'none'}
                                autoCorrect={false}
                                defaultValue={user.breed}
                                onChangeText={(text)=> {
                                    this._changeUserState('breed', text);
                                }}
                            />
                        </View>
                        <View style={styles.fieldItem}>
                            <Text style={styles.label}>年龄</Text>
                            <TextInput
                                placeholder={"输入你的年龄"}
                                style={styles.inputField}
                                autoCapitalize={'none'}
                                autoCorrect={false}
                                defaultValue={user.age}
                                onChangeText={(text)=> {
                                    this._changeUserState('age', text);
                                }}
                            />
                        </View>

                        <View style={styles.fieldItem}>
                            <Text style={styles.label}>性别</Text>
                            <Button onPress={()=> {
                                this._changeUserState('gender', 'male')
                            }}
                                    style={[styles.gender, user.gender === 'male' && styles.genderChecked]}
                            >
                                <Text style={[{fontFamily: 'iconfont'}]}>&#xe600;</Text>男
                            </Button>
                            <Button onPress={()=> {
                                this._changeUserState('gender', 'female')
                            }}
                                    style={[styles.gender, user.gender === 'female' && styles.genderChecked]}
                            >
                                <Text style={[{fontFamily: 'iconfont'}]}>&#xe600;</Text>女
                            </Button>
                        </View>

                        <Button
                            style={styles.btn}
                            onPress={this._submit}>保存信息</Button>
                    </View>
                </Modal>


                <Button
                    style={styles.btn}
                    onPress={this._logout}>退出登录</Button>
            </View>
        )
    },
});


const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    toolbar: {
        flexDirection: 'row',
        paddingTop: 25,
        paddingBottom: 12,
        backgroundColor: '#EE735C',
    },
    toolTitle: {
        flex: 1,
        fontSize: 16,
        color: '#fff',
        textAlign: 'center',
        fontWeight: '600',
    },
    avatarContainer: {
        width: width,
        height: 140,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#666',
    },
    avatarBox: {
        marginTop: 15,
        alignItems: 'center',
        justifyContent: 'center',
    },
    plusIcon: {
        padding: 20,
        paddingLeft: 25,
        paddingRight: 25,
        color: '#999',
        fontSize: 20,
        backgroundColor: '#fff',
        borderRadius: 8,
    },
    avatarTip: {
        color: '#fff',
        backgroundColor: 'transparent',
        fontSize: 14,
    },
    avatar: {
        marginBottom: 15,
        width: width * 0.2,
        height: width * 0.2,
        resizeMode: 'cover',
        borderRadius: width * 0.1,
    },
    toolEdit: {
        position: 'absolute',
        right: 10,
        top: 26,
        color: '#fff',
        textAlign: 'right',
        fontWeight: '600',
        fontSize: 14,
    },
    modalContainer: {
        flex: 1,
        paddingTop: 50,
        backgroundColor: '#fff',
    },
    fieldItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        height: 50,
        paddingLeft: 15,
        paddingRight: 15,
        borderColor: '#eee',
        borderBottomWidth: 1,
    },
    label: {
        color: '#ccc',
        marginRight: 10,
    },
    inputField: {
        height: 50,
        flex: 1,
        color: '#666',
        fontSize: 14,
    },
    closeIcon: {
        position: 'absolute',
        width: 40,
        height: 40,
        fontSize: 32,
        right: 20,
        top: 30,
        color: '#ee735c',
    },
    gender: {
        color: '#841584',
        borderColor: '#841584',
    },
    genderChecked: {
        color: '#ee735c',
        borderColor: '#ee735c',
    },
    btn: {
        marginTop: 10,
        marginRight: 10,
        marginLeft: 10,
        padding: 10,
        backgroundColor: 'transparent',
        borderColor: '#ee735c',
        borderWidth: 1,
        borderRadius: 4,
        color: '#ee735c',
    },
});