/**
 * Created by wuilly on 2017/3/24.
 */

'use strict';

import React, {Component} from 'react';
import Video from 'react-native-video';
import _ from 'lodash';
import request from '../common/request';
import config from '../common/config';
import {AudioRecorder, AudioUtils} from 'react-native-audio';
import * as Progress from 'react-native-progress';
import Sound from 'react-native-sound';
import Button from 'react-native-button';
import {
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    Dimensions,
    Image,
    AsyncStorage,
    ProgressViewIOS,
    Alert,
    Platform,
    Modal,
    TextInput,

} from 'react-native';


var width = Dimensions.get('window').width;
var height = Dimensions.get('window').height;
var ImagePicker = require('react-native-image-picker');
var videoOptions = {
    title: '选择视频',
    cancelButtonTitle: '取消',
    takePhotoButtonTitle: '录制10秒视频',
    chooseFromLibraryButtonTitle: '选择已有视频',
    noData: false,
    videoQuality: 'medium',
    mediaType: 'video',
    durationLimit: 10,
    storageOptions: {
        skipBackup: true,
        path: 'videos'
    }
};
var defaultState = {
    audioId: null,
    videoId: null,

    //发布视频
    title: null,
    modalVisible: false,
    publishing: false,
    willPublish: false,
    publishProgress: 0.01,

    previewVideo: null,
    //videoUpload
    video: null,
    videoUploaded: false,
    videoUploadedProgress: 0.01,
    videoUploading: false,
    //videoLoading
    videoProgress: 0.01,
    videoTotal: 0,
    currentTime: 0,

    //video player
    muted: true,
    rate: 1,
    resizeMode: 'contain',
    repeat: false,
    paused: false,
    //计时器 正在进行录制状态
    count: 3,
    recording: false,
    counting: false,
    //audio
    audio: null,
    audioPath: AudioUtils.DocumentDirectoryPath + '/wuhang.aac',
    hasPermission: undefined,
    currentTimeAudio: 0.0,
    finished: false,
    audioPlaying: false,
    recordDone: false,

    audioUploaded: false,
    audioUploadedProgress: 0.14,
    audioUploading: false,
}
export default React.createClass({
    getInitialState(){
        var user = this.props.user || {};
        var state = _.clone(defaultState);
        state.user = user;
        return state;

    },
//modal
    _closeModal(){
        this.setState({
            modalVisible: false
        });
    },
    _showModal(){
        this.setState({
            modalVisible: true
        });
    },
//视频方法开始
    _onLoadStart(){
        console.log('load');
    },
    _onLoad(){
        console.log('loads');
    },
    _onProgress(data){
        var duration = data.playableDuration;
        var currentTime = data.currentTime;
        var percent = Number((currentTime / duration).toFixed(2));
        this.setState({
            videoProgress: percent,
            videoTotal: duration,
            currentTime: Number(currentTime.toFixed(2)),
        });

    },
    _onEnd(){
        if (this.state.recording) {
            AudioRecorder.stopRecording()
            this.setState({
                videoProgress: 1,
                recording: false,
                recordDone: true
            });
        }

    },
    _onError(err){
        this.setState({
            videoOk: false,
        });
        console.log(err);
        console.log('_onError');
    },
    _preview(){
        if (this.state.audioPlaying) {
            AudioRecorder.stopRecording()
        }
        this.setState({
            videoProgress: 0,
            audioPlaying: true
        })
        //播放
        const s = new Sound(this.state.audioPath, '', (e) => {
            if (e) {
                console.log('error', e);
            }
            s.play();
        });
        this.refs.videoPlayer.seek(0);
    },
//视频方法结束

//视频上传方法开始
    _getToken(body){
        var signatureURL = config.api.base + config.api.signature;

        body.accessToken = this.state.user.accessToken;
        return request.post(signatureURL, body)
    },
    _upload(body, type){
        var xhr = new XMLHttpRequest();
        var url = config.qiniu.upload;

        if (type === 'audio') {
            url = config.cloudinary.video
        }

        var state = {}
        state[type + 'UploadedProgress'] = 0
        state[type + 'Uploading'] = true
        state[type + 'Uploaded'] = false

        this.setState(state);

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
                var newState = {}
                newState[type] = response;
                newState[type + 'Uploading'] = false;
                newState[type + 'Uploaded'] = true;
                this.setState(newState);

                //请求接口获取信息

                var updateURL = config.api.base + config.api[type];
                var accessToken = this.state.user.accessToken;
                var updateBody = {
                    accessToken: accessToken,
                }
                if (type === 'audio') {
                    updateBody.videoId = this.state.videoId
                }
                updateBody[type] = response
                request.post(updateURL, updateBody)
                    .catch((err)=> {
                        console.log(err);
                        if (type === 'audio') {
                            Alert.alert('音频同步出错，请重新上传')
                        } else if (type === 'video') {
                            Alert.alert('视频同步出错，请重新上传')
                        }
                    })
                    .then((data)=> {
                        if (data && data.success) {
                            var mediaState = {}
                            mediaState[type + 'Id'] = data.data
                            console.log(type)
                            //弹出modal
                            if (type === 'audio') {
                                this._showModal();
                                mediaState.willPublish = true
                            }

                            this.setState(mediaState)
                        } else {
                            if (type === 'audio') {
                                Alert.alert('音频同步出错，请重新上传')
                            } else if (type === 'video') {
                                Alert.alert('视频同步出错，请重新上传')
                            }
                        }
                    })


            }


        }


        //进度条事件
        if (xhr.upload) {
            xhr.upload.onprogress = (event)=> {
                if (event.lengthComputable) {
                    var percent = Number((event.loaded / event.total).toFixed(2));

                    var progressState = {};
                    progressState[type + 'UploadedProgress'] = percent
                    this.setState(progressState);

                }
            }
        }
        xhr.send(body);

    },
//视频上传方法结束
//获取自己本地的用户资料开始
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
    componentDidMount(){
        this._getAsyncStorage();
        this._initAudio();
    },
//获取自己本地的用户资料结束

    _pickVideo(){
        console.log('diao qi shipin xuanzeqqi');
        ImagePicker.showImagePicker(videoOptions, (response) => {

            if (response.didCancel) {
                return
            }


            //上传服务端
            var uri = response.uri;
            var state = _.clone(defaultState);
            state.previewVideo = uri;
            state.user = this.state.user;
            this.setState(state);
//qiniu上传
            this._getToken({
                type: 'video',
                cloud: 'qiniu'
            })
                .catch((err)=> {
                    console.log(err);
                    Alert.alert('上传出错');
                })
                .then((data)=> {
                    if (data && data.success) {
                        //data.data即是需要的加密信息
                        let token = data.data.token;
                        let key = data.data.key;


                        var body = new FormData();
                        body.append("token", token);
                        body.append("key", key);
                        body.append("file", {
                            'type': 'video/mp4',
                            'uri': uri,
                            'name': key,
                        });

                        this._upload(body, 'video');
                    }
                })

        });
    },
//声音文件实例化开始
    _uploadAudio(){
        var folder = 'audio';
        var tags = 'app,audio';
        var timestamp = Date.now();
        this._getToken({
            type: 'audio',
            cloud: 'cloudinary',
            timestamp: timestamp,
        })
            .catch((e)=> {
                console.log(e);
            })
            .then((data)=> {
                if (data && data.success) {
                    //data.data即是需要的加密信息

                    //模拟后台操作
                    let signature = data.data.token
                    let key = data.data.key
                    var body = new FormData();
                    body.append("folder", folder);
                    body.append("tags", tags);
                    body.append("timestamp", timestamp);
                    body.append("signature", signature);
                    body.append("api_key", config.cloudinary.api_key);
                    body.append("resource_type", 'video');
                    body.append("file", {
                        type: 'video/mp4',
                        uri: this.state.audioPath,
                        name: key
                    });

                    this._upload(body, 'audio');
                }
            })


    },
    _initAudio(){
        this.prepareRecordingPath(this.state.audioPath);

        AudioRecorder.onProgress = (data) => {
            this.setState({currentTimeAudio: Math.floor(data.currentTime)});
        };

        AudioRecorder.onFinished = (data) => {
            // Android callback comes in the form of a promise instead.
            if (Platform.OS === 'ios') {
                this._finishRecording(data.status === "OK", data.audioFileURL);
            }
        };

    },
    prepareRecordingPath(audioPath){
        AudioRecorder.prepareRecordingAtPath(audioPath, {
            SampleRate: 22050,
            Channels: 1,
            AudioQuality: "High",
            AudioEncoding: "aac",
            AudioEncodingBitRate: 32000
        });
    },
    _checkPermission() {
        if (Platform.OS !== 'android') {
            return Promise.resolve(true);
        }

        const rationale = {
            'title': 'Microphone Permission',
            'message': 'AudioExample needs access to your microphone so you can record audio.'
        };

        return PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.RECORD_AUDIO, rationale)
            .then((result) => {
                console.log('Permission result:', result);
                return (result === true || result === PermissionsAndroid.RESULTS.GRANTED);
            });
    },
    _finishRecording(didSucceed, filePath) {
        this.setState({finished: didSucceed});
        console.log(`Finished recording of duration ${this.state.currentTimeAudio} seconds at path: ${filePath}`);
    },
//声音文件实例化结束
    //计时器
    handleClick(){
        var that = this;
        if (!this.state.counting && !this.state.recording && !this.state.audioPlaying) {
            this.setState({
                counting: true
            });

            this.timer = setInterval(function () {
                var count = this.state.count;
                count -= 1;
                if (count < 1) {
                    //结束回调
                    this.setState({
                        videoProgress: 0,
                        counting: false,
                        recording: true
                    });
                    count = 3
                    //启动录音
                    console.log('启动录音')
                    AudioRecorder.startRecording()
                    that.refs.videoPlayer.seek(0)
                    clearInterval(this.timer);
                }
                this.setState({
                    count: count
                });
            }.bind(this), 1000);
        }
    },
    _submit(){
        var body = {
            title: this.state.title,
            videoId: this.state.videoId,
            audioId: this.state.audioId,
        }

        var creationURL = config.api.base + config.api.creations
        var user = this.state.user

        if (user && user.accessToken) {
            body.accessToken = user.accessToken

            this.setState({
                publishing: true
            })
            request.post(creationURL, body)
                .then((data)=> {
                    if (data && data.success) {
                        if (data.data.finish === 100) {

                            var state = _.clone(defaultState);
                            state.modalVisible = true;
                            state.publishProgress = 100;
                            this.setState(state);

                            Alert.alert('视频发布成功，请点击右上角返回')
                        } else {
                            var state = this.state
                            state.publishProgress = 50;
                            state.publishing = false;
                            state.modalVisible = true;
                            state.audioUploaded = true;
                            this.setState(state);

                            Alert.alert('视频发布失败，请重新尝试');
                        }
                    } else {
                        var state = this.state
                        state.publishProgress = 50;
                        state.publishing = false;
                        state.modalVisible = true;
                        state.audioUploaded = true;
                        this.setState(state);

                        Alert.alert('视频发布失败，请重新尝试')
                    }
                })
                .catch((err)=> {
                    console.log(err)
                    var state = this.state
                    state.publishProgress = 50;
                    state.publishing = false;
                    state.modalVisible = true;
                    state.audioUploaded = true;
                    this.setState(state);

                    Alert.alert('视频未同步，请重新尝试')
                })

        }

    },
    render () {
        return (
            <View style={styles.container}>
                <View style={styles.toolbar}>
                    <Text style={styles.toolTitle}>{this.state.previewVideo ? '点击按钮配音' : '录制一段视频并配音吧'}</Text>
                    {
                        this.state.previewVideo && this.state.videoUploaded
                            ? <Text style={styles.toolEdit} onPress={this._pickVideo}>更换上传视频</Text>
                            : null
                    }
                </View>

                <View style={styles.page}>
                    {
                        this.state.previewVideo
                            ? <View style={styles.videoContainer}>
                            <View style={styles.videoBox}>
                                <Video
                                    ref="videoPlayer"
                                    source={{uri: this.state.previewVideo}}
                                    style={styles.video}
                                    volume={3}
                                    paused={this.state.paused}
                                    rate={this.state.rate}
                                    muted={this.state.muted}
                                    resizeMode={this.state.resizeMode}
                                    repeat={this.state.repeat}

                                    onLoadStart={this._onLoadStart}
                                    onLoad={this._onLoad}
                                    onProgress={this._onProgress}
                                    onEnd={this._onEnd}
                                    onError={this._onError}
                                />
                                {
                                    !this.state.videoUploaded && this.state.videoUploading
                                        ?
                                        <View style={styles.progressTipBox}>
                                            <ProgressViewIOS style={styles.progressBar} progressTintColor="#ee735c"
                                                             progress={this.state.videoUploadedProgress}/>
                                            <Text
                                                style={styles.progressTip}>正在消除视频的声音，已完成{(this.state.videoUploadedProgress * 100).toFixed(2)}%</Text>
                                        </View>
                                        : null
                                }
                                {
                                    this.state.recording || this.state.audioPlaying
                                        ?

                                        <View style={styles.progressTipBox}>
                                            <ProgressViewIOS style={styles.progressBar} progressTintColor="#ee735c"
                                                             progress={this.state.videoProgress}/>
                                            {
                                                this.state.recording
                                                    ?
                                                    <Text style={styles.progressTip}>正录制声音</Text>
                                                    : null

                                            }
                                        </View>
                                        : null
                                }

                                {
                                    this.state.recordDone
                                        ?
                                        <View style={styles.previewBox}>
                                            <Text
                                                style={[{fontFamily: 'iconfont'}, styles.previewIcon]}>&#xe600;</Text>
                                            <Text style={styles.previewText} onPress={this._preview}>预览</Text>
                                        </View>
                                        : null
                                }
                            </View>
                        </View>
                            : <TouchableOpacity style={styles.uploadContainer} onPress={this._pickVideo}>
                            <View style={styles.uploadBox}>
                                <Image style={styles.uploadIcon} source={require('../assets/images/upload.png')}/>
                                <Text style={styles.uploadTitle}>点我一下上传视频</Text>
                                <Text style={styles.uploadDesc}>视频最好不要超过20秒哦</Text>
                            </View>
                        </TouchableOpacity>
                    }
                    {
                        this.state.videoUploaded
                            ?
                            <View style={styles.recordBox}>
                                <View
                                    style={[styles.recordIconBox, (this.state.recording || this.state.audioPlaying) && styles.recordOn]}>
                                    {
                                        this.state.counting && !this.state.recording
                                            ?
                                            <Text style={styles.countBtn}>{this.state.count}</Text>
                                            :
                                            <TouchableOpacity onPress={this.handleClick}>
                                                <Text
                                                    style={[{fontFamily: 'iconfont'}, styles.recordIcon]}>&#xe600;</Text>
                                            </TouchableOpacity>
                                    }
                                </View>
                            </View>
                            : null
                    }
                    {
                        this.state.videoUploaded && this.state.recordDone
                            ?
                            <View style={styles.uploadAudioBox}>
                                {
                                    !this.state.audioUploaded && !this.state.audioUploading
                                        ?
                                        <Text style={styles.uploadAudioText} onPress={this._uploadAudio}>下一步</Text>
                                        : null
                                }
                                {
                                    this.state.audioUploading
                                        ?
                                        <Progress.Circle
                                            showsText={true}
                                            color={'#ee735c'}
                                            progress={this.state.audioUploadedProgress}
                                            size={60}/>
                                        : null
                                }
                            </View>
                            : null
                    }
                </View>

                <Modal
                    animationType={"slide"}
                    transparent={false}
                    visible={this.state.modalVisible}
                >
                    <View style={styles.modalContainer}>
                        <Text onPress={this._closeModal}
                              style={[{fontFamily: 'iconfont'}, styles.closeIcon]}>&#xe600;</Text>
                        {
                            this.state.audioUploaded && !this.state.publishing
                                ?
                                <View style={styles.fieldBox}>
                                    <TextInput
                                        placeholder={"介绍一下你的视频吧！"}
                                        style={styles.inputField}
                                        autoCapitalize={'none'}
                                        autoCorrect={false}
                                        defaultValue={this.state.title}
                                        onChangeText={(text)=> {
                                            this.setState({
                                                title: text
                                            })
                                        }}
                                    />
                                </View>
                                : null
                        }
                        {
                            this.state.publishing
                                ?
                                <View style={styles.loadingBox}>
                                    <Text style={styles.loadingText}>耐心等待一下，正在生成视频中...</Text>
                                    {
                                        this.state.willPublish
                                            ?
                                            <Text style={styles.loadingText}>耐心等待一下，正在合并视频...</Text>
                                            : null
                                    }
                                    {
                                        this.state.publishProgress > 0.3
                                            ?
                                            <Text style={styles.loadingText}>开始上传...</Text>
                                            : null
                                    }
                                    <Progress.Circle
                                        showsText={true}
                                        color={'#ee735c'}
                                        progress={this.state.publishProgress}
                                        size={60}/>
                                </View>
                                : null
                        }

                        <View style={styles.submitBox}>
                            {
                                this.state.audioUploaded && !this.state.publishing
                                    ?
                                    <Button
                                        style={styles.btn}
                                        onPress={this._submit}>保存信息</Button>
                                    : null
                            }
                        </View>
                    </View>
                </Modal>


            </View>
        )
    }
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
    toolEdit: {
        position: 'absolute',
        right: 10,
        top: 26,
        color: '#fff',
        textAlign: 'right',
        fontWeight: '600',
        fontSize: 14,
    },
    page: {
        flex: 1,
        alignItems: 'center',
    },
    uploadContainer: {
        marginTop: 90,
        width: width - 40,
        paddingBottom: 10,
        borderWidth: 1,
        borderColor: '#ee735c',
        justifyContent: 'center',
        borderRadius: 6,
        backgroundColor: '#FFF',
    },
    uploadBox: {
        //flex:1,
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
    },
    uploadTitle: {
        marginBottom: 10,
        textAlign: 'center',
        fontSize: 16,
        color: '#000',
    },
    uploadDesc: {
        color: '#999',
        textAlign: 'center',
        fontSize: 12,
    },
    uploadIcon: {
        width: 110,
        resizeMode: 'contain',
    },
    videoContainer: {
        width: width,
        justifyContent: 'center',
        alignItems: 'flex-start',
    },
    videoBox: {
        width: width,
        height: height * 0.6,
    },
    video: {

        width: width,
        height: height * 0.6,
        backgroundColor: '#333',
    },
    progressTipBox: {
        width: width,
        height: 30,
        backgroundColor: 'rgba(244,244,244,0.65)',
    },
    progressTip: {
        color: '#333',
        width: width - 10,
        padding: 5,
    },
    progressBar: {
        width: width,
    },
    recordBox: {
        width: width,
        height: 60,
        alignItems: 'center'
    },
    recordIconBox: {
        width: 68,
        height: 68,
        marginTop: -30,
        borderRadius: 34,
        backgroundColor: '#ee735c',
        borderWidth: 1,
        borderColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
    },
    recordIcon: {
        fontSize: 58,
        backgroundColor: 'transparent',
        color: '#fff',
    },
    countBtn: {
        fontSize: 32,
        fontWeight: '600',
        color: '#fff',
    },
    recordOn: {
        backgroundColor: '#ccc',
    },
    previewBox: {
        width: 80,
        height: 30,
        position: 'absolute',
        right: 10,
        bottom: 10,
        borderWidth: 1,
        borderColor: '#ee735c',
        borderRadius: 3,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    previewIcon: {
        marginRight: 5,
        fontSize: 20,
        color: '#ee735c',
        backgroundColor: 'transparent',
    },
    previewText: {
        backgroundColor: 'transparent',
        fontSize: 20,
        color: '#ee735c',
    },
    uploadAudioBox: {
        width: width,
        height: 60,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    uploadAudioText: {
        width: width - 20,
        padding: 5,
        borderWidth: 1,
        borderColor: '#ee735c',
        borderRadius: 5,
        textAlign: 'center',
        color: '#ee735c',
        fontSize: 30,
    },
    inputField: {
        height: 36,
        color: '#666',
        fontSize: 14,
        textAlign: 'center',
    },
    btn: {
        marginTop: 65,
        marginRight: 10,
        marginLeft: 10,
        padding: 10,
        backgroundColor: 'transparent',
        borderColor: '#ee735c',
        borderWidth: 1,
        borderRadius: 4,
        color: '#ee735c',
    },
    modalContainer: {
        width: width,
        height: height,
        paddingTop: 50,
        backgroundColor: '#fff',
    },
    closeIcon: {
        position: 'absolute',
        fontSize: 32,
        right: 20,
        top: 30,
        color: '#ee735c',
    },
    loadingBox: {
        width: width,
        height: 50,
        marginTop: 10,
        padding: 15,
        alignItems: 'center',
    },
    fieldBox: {
        width: width - 40,
        height: 36,
        marginTop: 30,
        marginRight: 20,
        marginLeft: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#eaeaea',
    },
    loadingText: {
        marginBottom: 10,
        textAlign: 'center',
        color: '#333',
    },
    submitBox: {
        marginTop: 50,
        padding: 15
    }
});