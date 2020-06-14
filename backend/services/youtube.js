const { google } = require('googleapis');
require('dotenv').config();

const KEY = process.env.YOUTUBE_KEY;

const search = (q) => {
    return new Promise((resolveSearch) => {
        google.youtube('v3').search.list({
            key: KEY,
            part: 'snippet',
            q: q,
            maxResults: 5,
        }).then(response => {
            let result = response.data.items.filter(x => x.id.videoId).map((x) => {
                return new Promise((resolveChannel) => {
                    getChannel(x.snippet.channelId).then(channel => {
                        let data = {
                            videoId: x.id.videoId,
                            title: x.snippet.title,
                            channelTitle: x.snippet.channelTitle,
                            videoThumbnail: x.snippet.thumbnails.default.url,
                            channelThumbnail: channel.channelThumbnail
                        };
                        resolveChannel(data);
                    })
                })
            })
            resolveSearch(Promise.all(result));
        })
    })
}

const getChannel = (channelId) => {
    return new Promise((resolve) => {
        google.youtube('v3').channels.list({
            key: KEY,
            id: channelId,
            part: 'snippet',
            maxResults: 1
        }).then(response => {
            let result = response.data.items.map(x => {
                return {
                    channelThumbnail: x.snippet.thumbnails.default.url
                }
            });
            let channel = result[0];
            resolve(channel);
        })
    })
}

module.exports = {
    search
}