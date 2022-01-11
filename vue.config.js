const path = require('path')

const resolve = dir => {
    return path.join(__dirname, dir)
}

// vue.config.js
module.exports = {

    configureWebpack: {
        name: process.env.VUE_APP_TITLE,
        resolve: {
            alias: {
                '@': resolve('src'),
            }
        }
    },
    lintOnSave:false,
    outputDir: 'docker/nginx/dist',
    devServer: {
        port: 9090,
        proxy: {
            '/api': {
                target: 'http://127.0.0.1:9999',
                ws: false,
                changeOrigin: true,
                pathRewrite: {
                    '^/api': '' // 需要rewrite的,
                }
            },
        }
    },
}
