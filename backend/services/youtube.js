const { google } = require('googleapis');
require('dotenv').config();

const KEY = process.env.YOUTUBE_KEY;
// const CACHE = {

// }

// //CLEAR EVERY HOUR
// setInterval(() => {
//     CACHE = {}
// }, 60*60000);

const search = (q, pageToken) => {
    return new Promise((resolveSearch) => {
        google.youtube('v3').search.list({
            key: KEY,
            part: 'snippet',
            q: q,
            maxResults: 15,
            type: "video",
            pageToken: pageToken
        }).then(response => {
            let channelIds = response.data.items.map(x => x.snippet.channelId).join(',');
            _getChannels(channelIds).then(channels => {
                let items = response.data.items.map((x) => {
                    return {
                        videoId: x.id.videoId,
                        title: x.snippet.title,
                        description: x.snippet.description,
                        channelTitle: x.snippet.channelTitle,
                        videoThumbnail: x.snippet.thumbnails.medium.url,
                        channelThumbnail: channels[x.snippet.channelId].channelThumbnail
                    };
                });

                let { nextPageToken } = response.data;
                let { totalResults } = response.data.pageInfo;
                resolveSearch({ items, nextPageToken, totalResults });
            });
        });
    });
}

const _getChannels = (channelIds) => {
    return new Promise((resolve) => {
        google.youtube('v3').channels.list({
            key: KEY,
            id: channelIds,
            part: 'snippet',
            maxResults: 1
        }).then(response => {
            let channels = {};
            response.data.items.forEach(x => {
                channels[x.id] = {
                    channelId: x.id,
                    channelThumbnail: x.snippet.thumbnails.default.url
                }
            });
            resolve(channels);
        })
    })
}

module.exports = {
    search
}

// search('pewdie').then(console.log)