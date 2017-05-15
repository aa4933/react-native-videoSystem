/**
 * Created by wuilly on 2017/3/24.
 */

'use strict';

import React, {Component} from 'react';
import Video from 'react-native-video';
import Button from 'react-native-button';
import request from '../common/request';
import config from '../common/config';
import {
    StyleSheet,
    Text,
    View,
    Dimensions,
    ActivityIndicator,
    TouchableOpacity,
    Image,
    ListView,
    TextInput,
    Modal,
    AsyncStorage,
    Alert,
} from 'react-native';

var width = Dimensions.get('window').width;

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
var cacheResults = {
    nextPage: 1,
    items: [],
    total: 0,
}


export default React.createClass({
    getInitialState(){
        var data = this.props.data;
        var ds = new ListView.DataSource({rowHasChanged: (r1, r2) => r1 !== r2});
        var user = this.props.user || {};
        return {
            //comment
            user: user,
            dataSource: ds.cloneWithRows([]),

            //videoLoading
            videoReady: false,
            videoOk: true,
            playing: false,
            videoProgress: 0.01,
            videoTotal: 0,
            currentTime: 0,

            data: data,

            //modal
            animationType: 'none',
            modalVisible: false,
            isSending: false,
            content: '',

            //video player
            muted: true,
            rate: 1,
            resizeMode: 'contain',
            repeat: false,
            paused: false,
        }
    },
    _backList(){
        this.props.navigator.pop();
    },
    _onLoadStart(){
        console.log('load');
    },
    _onLoad(){
        console.log('loads');
    },
    _onProgress(data){
        if (!this.state.videoReady) {
            this.setState({
                videoReady: true,
            });
        }
        var duration = data.playableDuration;
        var currentTime = data.currentTime;
        var percent = Number((currentTime / duration).toFixed(2));
        var newState = {
            videoProgress: percent,
            videoTotal: duration,
            currentTime: Number(currentTime.toFixed(2)),
        }
        if (!this.state.videoReady) {
            newState.videoReady = true
        }
        if (!this.state.videoReady) {
            newState.playing = true
        }
        this.setState(newState);

    },
    _onEnd(){
        this.setState({
            videoProgress: 1,
            playing: false,
        });

    },
    _onError(err){
        this.setState({
            videoOk: false,
        });
        console.log(err);
        console.log('_onError');
    },
    _replay(){
        this.refs.videoPlayer.seek(0);
    },
    _pause(){
        if (!this.state.paused) {
            this.setState({
                paused: true,
            });
        }
    },
    _resume(){
        if (this.state.paused) {
            this.setState({
                paused: false,
            });
        }
    },
    componentDidMount(){
        this._getAsyncStorage();
    },
    _getAsyncStorage(){
        AsyncStorage.getItem('user')
            .then((data)=> {
                var user;
                if (data) {
                    user = JSON.parse(data);
                }
                if (user && user.accessToken) {
                    console.log(user.accessToken)
                    this.setState({
                        user: user
                    })
                    //确定拿到token以后才能fetch
                    this._fetchData();
                }
            })
            .catch((err)=> {
                console.log(err);
            })
    },
    _fetchData(page){
        var url = config.api.base + config.api.comments;

        //清空缓存很重要
        cacheResults = {
            nextPage: 1,
            items: [],
            total: 0,
        };

        this.setState({
            isLoadingTail: true,
        });

        request.get(url, {
            accessToken: this.state.user.accessToken,
            creation: this.state.data._id,
            page: page
        })
            .then((data) => {
                if (data.success) {

                    var items = cacheResults.items.slice();
                    items = items.concat(data.data);
                    cacheResults.nextPage += 1;


                    cacheResults.items = items;
                    cacheResults.total = data.total;

                    this.setState({
                        isLoadingTail: false,
                        dataSource: this.state.dataSource.cloneWithRows(
                            cacheResults.items)
                    });

                }
                console.log(data);
            })
            .catch((error) => {
                this.setState({
                    isLoadingTail: false,
                });

                console.error(error);
            });
    },
    _focus(){
        this._setModalVisible(true);
    },
    _blur(){

    },
    _closeModal(){
        this._setModalVisible(false);
    },
    _setModalVisible(isVisible){
        this.setState({
            modalVisible: isVisible,
        });
    },
    _renderHeader(){
        var data = this.state.data;
        return (
            <View style={styles.listHeader}>
                <View style={styles.infoBox}>
                    <Image style={styles.avatar} source={{uri: avatar(data.author.avatar, 'image')}}/>
                    <View style={styles.descBox}>
                        <Text style={styles.nickname}>{data.author.nickname}</Text>
                        <Text style={styles.title}>{data.title}</Text>
                    </View>
                </View>
                <View style={styles.commentBox}>
                    <View style={styles.comment}>
                        <TextInput
                            placeholder='敢不敢评论一个...'
                            style={styles.content}
                            multiline={true}
                            onFocus={this._focus}
                        />
                    </View>
                </View>
                <View style={styles.commentArea}>
                    <Text style={styles.commentTitle}>精彩评论</Text>
                </View>
            </View>
        );
    },
    _renderFooter(){
        if (!this._hasMore() && cacheResults.total !== 0) {
            return (
                <View style={styles.loadingMore}>
                    <Text style={styles.loadingText}>没有更多了</Text>
                </View>
            );
        }

        if (!this.state.isLoadingTail) {
            return (<View style={styles.loadingMore}/>);
        }


        return (<ActivityIndicator style={styles.loadingMore}/>)

    },
    _hasMore(){
        return cacheResults.items.length !== cacheResults.total
    },
    _fetchMoreData (){
        if (!this._hasMore() || this.state.isLoadingTail) {
            return
        }

        var page = cacheResults.nextPage;
        this._fetchData(page);
    },
    _renderRow(row){
        return (
            <View key={row.id} style={styles.replyBox}>
                <Image style={styles.replyAvatar} source={{uri: avatar(row.replyBy.avatar, 'image')}}/>
                <View style={styles.reply}>
                    <Text style={styles.replyNickname}>{row.replyBy.nickname}</Text>
                    <Text style={styles.replyContent}>{row.content}</Text>
                </View>
            </View>
        )
    },
    _submit(){
        //校验是否存在内容，防止空提交
        if (!this.state.content) {
            return Alert.alert("不能提交空内容");
        }
        //校验防止重复提交
        if (this.state.isSending) {
            return Alert.alert("请不要重复提交");
        }

        this.setState({
            isSending: true,
        }, () =>{
            var body = {
                    accessToken: this.state.user.accessToken,
                comment: {
                    creation: this.state.data._id,
                    content: this.state.content,
                }
            };
            var url = config.api.base + config.api.comments ;
            request.post(url, body)
                .then((data)=> {
                    if (data && data.success) {
                        //成功以后出现在最前面
                        var items = cacheResults.items.slice();
                        var content = this.state.content;

                        items = [{
                            content: content,
                            replyBy: {
                                nickname: this.state.user.nickname,
                                avatar: this.state.user.avatar,
                            }
                        }].concat(items)

                        cacheResults.items = items;
                        cacheResults.total = cacheResults.total + 1;

                        this.setState({
                            content: '',
                            isSending: false,
                            dataSource: this.state.dataSource.cloneWithRows(cacheResults.items),
                        });
                       //this._setModalVisible(false);
                        Alert.alert("评论成功");
                    }
                })
                .catch((err)=> {
                    console.log(err);
                    this.setState({
                        isSending: false,
                    });
                    Alert.alert("留言失败，稍后重试");
                })

        });

    },
    render () {
        var data = this.props.data;
        return (
            <View style={styles.container}>
                <View style={styles.headerDetail}>
                    <TouchableOpacity style={styles.backBox} onPress={this._backList}>
                        <Text style={[{fontFamily: 'iconfont'}, styles.backIcon]}>&#xe600;</Text>
                        <Text style={styles.backText}>返回</Text>
                    </TouchableOpacity>
                    <Text style={styles.headerDetailTitle} numberOfLines={1}>视频详情页面</Text>
                </View>
                <View style={styles.videoBox}>
                    <Video
                        ref="videoPlayer"
                        source={{uri: config.qiniu.show + data.qiniu_video}}
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
                        !this.state.videoOk && <Text style={styles.failText}>视频出错了！很抱歉</Text>
                    }
                    {
                        !this.state.videoReady && <ActivityIndicator color='#ee735c' style={styles.loading}/>
                    }
                    {
                        this.state.videoReady && !this.state.playing
                            ? <Text
                            style={[{fontFamily: 'iconfont', fontSize: 45}, styles.playing]}
                            onPress={this._replay}>&#xe622;</Text>
                            : null
                    }
                    {
                        this.state.videoReady && this.state.playing
                            ? <TouchableOpacity onPress={this._pause} style={styles.pauseBtn}>
                            {
                                this.state.paused
                                    ? <Text
                                    style={[{fontFamily: 'iconfont', fontSize: 45}, styles.resumeIcon]}
                                    onPress={this._resume}>&#xe622;</Text>
                                    : <Text></Text>
                            }
                        </TouchableOpacity>
                            : null
                    }
                    <View style={styles.progressBox}>
                        <View style={[styles.progressBar, {width: width * this.state.videoProgress}]}>

                        </View>
                    </View>
                </View>


                <ListView
                    dataSource={this.state.dataSource}
                    renderRow={this._renderRow}
                    enableEmptySections={true}
                    showsVerticalScrollIndicator={false}
                    automaticallyAdjustContentInsets={false}

                    //分页下拉刷新
                    renderHeader={this._renderHeader}
                    renderFooter={this._renderFooter}
                    onEndReached={this._fetchMoreData}
                    onEndReachedThreshold={20}
                />

                <Modal
                    animationType={'fade'}
                    visible={this.state.modalVisible}
                    onRequestClose={()=> {
                        this._setModalVisible(false)
                    }}>
                    <View style={styles.modalContainer}>
                        <Text onPress={this._closeModal}
                              style={[{fontFamily: 'iconfont'}, styles.closeIcon]}>&#xe600;</Text>
                        <View style={styles.commentBox}>
                            <View style={styles.comment}>
                                <TextInput
                                    placeholder='敢不敢评论一个...'
                                    style={styles.content}
                                    multiline={true}
                                    defaultValue={this.state.content}
                                    onChangeText={(text)=> {
                                        this.setState({
                                            content: text,
                                        });
                                    }}
                                />
                            </View>
                        </View>
                        <Button onPress={this._submit} style={styles.submitBtn}>评论</Button>
                    </View>
                </Modal>
            </View>
        )
    }
});


const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5FCFF',
    },
    modalContainer: {
        flex: 1,
        paddingTop: 45,
        backgroundColor: '#fff',
    },
    closeIcon: {
        alignSelf: 'center',
        fontSize: 30,
        color: '#ee753c',
    },
    submitBtn: {
        width: width - 20,
        padding: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 20,
        marginBottom: 20,
        marginRight: 10,
        marginLeft: 10,
        borderWidth: 1,
        borderColor: '#ee753c',
        borderRadius: 4,
        fontSize: 18,
        color: '#ee753c',
    },
    headerDetail: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        width: width,
        height: 64,
        paddingTop: 20,
        paddingLeft: 10,
        paddingRight: 10,
        borderBottomWidth: 1,
        borderColor: "rgba(0,0,0,0.1)",
        backgroundColor: '#fff',
    },
    backBox: {
        position: 'absolute',
        left: 12,
        top: 32,
        width: 50,
        flexDirection: 'row',
        alignItems: 'center',
    },
    headerDetailTitle: {
        width: width - 150,
        textAlign: 'center',
    },
    backIcon: {
        color: '#999',
        fontSize: 20,
        marginRight: 5,
    },
    backText: {
        color: '#999',
    },
    videoBox: {
        width: width,
        height: width * 0.56,
        backgroundColor: '#000'
    },
    video: {
        width: width,
        height: width * 0.56,
        backgroundColor: '#000'
    },
    failText: {
        position: 'absolute',
        left: 0,
        top: 90,
        width: width,
        backgroundColor: 'transparent',
        textAlign: 'center',
        color: '#fff',
    },
    loading: {
        position: 'absolute',
        left: 0,
        top: 80,
        width: width,
        alignSelf: 'center',
        backgroundColor: 'transparent',
    },
    progressBox: {
        width: width,
        height: 2,
        backgroundColor: '#ccc',
    },
    progressBar: {
        width: 1,
        height: 2,
        backgroundColor: '#ff6600',
    },
    playing: {
        position: 'absolute',
        top: 80,
        left: width / 2 - 30,
        width: 60,
        height: 60,
        paddingTop: 8,
        paddingLeft: 15,
        backgroundColor: 'transparent',
        borderColor: '#fff',
        borderWidth: 1,
        borderRadius: 30,
        color: '#ed7b66',
    },
    pauseBtn: {
        width: width,
        height: 360,
        position: 'absolute',
        left: 0,
        top: 0,
    },
    resumeIcon: {
        position: 'absolute',
        top: 80,
        left: width / 2 - 30,
        width: 60,
        height: 60,
        paddingTop: 8,
        paddingLeft: 15,
        backgroundColor: 'transparent',
        borderColor: '#fff',
        borderWidth: 1,
        borderRadius: 30,
        color: '#ed7b66',
    },
    infoBox: {
        width: width,
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 10,
    },
    avatar: {
        width: 60,
        height: 60,
        marginRight: 10,
        marginLeft: 10,
        borderRadius: 30,
    },
    descBox: {
        flex: 1,
    },
    nickname: {
        fontSize: 18,
    },
    title: {
        marginTop: 8,
        fontSize: 16,
        color: '#666',
    },
    replyBox: {
        flexDirection: 'row',
        justifyContent: 'flex-start',
        marginTop: 10,
    },
    replyAvatar: {
        width: 40,
        height: 40,
        marginLeft: 10,
        marginRight: 10,
        borderRadius: 20,
    },
    replyNickname: {
        color: '#666'
    },
    replyContent: {
        marginTop: 4,
        color: '#666',
    },
    reply: {
        flex: 1,
    },
    loadingMore: {
        marginVertical: 20
    },
    loadingText: {
        color: '#777',
        textAlign: 'center',
    },
    commentBox: {
        marginTop: 10,
        marginBottom: 10,
        padding: 8,
        width: width,
    },
    content: {
        paddingLeft: 2,
        color: '#333',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 4,
        fontSize: 14,
        height: 80,
    },
    commentArea: {
        width: width,
        paddingBottom: 6,
        paddingLeft: 10,
        paddingRight: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#eee'
    },
});