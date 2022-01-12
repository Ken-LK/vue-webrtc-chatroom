/**
 * websocket处理类
 */
let Socket = ''
let setIntervalWebsocketPush = null
let wsUrl = ''
let lockReconnect = false

/**
 * 建立websocket连接
 * @param {string} url ws地址
 */
export const createSocket = url => {
    Socket && Socket.close()
    if (!Socket) {
        console.log('建立websocket连接')
        wsUrl = url
        if (url) {
            Socket = new WebSocket(url)
            Socket.onopen = onopenWS
            Socket.onmessage = onmessageWS
            Socket.onerror = onerrorWS
            Socket.onclose = oncloseWS
        }

    } else {
        console.log('websocket已连接')
    }
}

/**
 * 关闭websocket连接
 */
export const closeSocket = () => {
    console.log('断开websocket连接')
    Socket = null
}

/**打开WS之后发送心跳 */
const onopenWS = () => {
    sendPing()
}

/**连接失败重连 */
const onerrorWS = () => {
    console.log('websocket发送异常....正在尝试重连')
    Socket.close()
    clearInterval(setIntervalWebsocketPush)
    reconnectWS()
}

/**断开重连 */
const oncloseWS = () => {
    clearInterval(setIntervalWebsocketPush)
    console.log('websocket已断开....正在尝试重连')
    reconnectWS()
}

/**
 * 重试5次，间隔5s
 */
const reconnectWS = () => {
    if (lockReconnect) return
    lockReconnect = true
    console.log("正在重连，当前时间" + new Date())
    setTimeout(() => {
        Socket = null
        createSocket(wsUrl)
        lockReconnect = false
    }, 5000)

}


/**WS数据接收统一处理 */
const onmessageWS = e => {
    window.dispatchEvent(new CustomEvent('onmessageWS', {
        detail: {
            data: e.data
        }
    }))
}

/**
 * 发送数据但连接未建立时进行处理等待重发
 * @param {any} message 需要发送的数据
 */
const connecting = message => {
    setTimeout(() => {
        if (Socket.readyState === WebSocket.CONNECTING) {
            connecting(message)
        } else {
            Socket.send(JSON.stringify(message))
        }
    }, 1000)
}

/**
 * 发送数据
 * @param {any} message 需要发送的数据
 */
export const sendWSPush = message => {
    if (Socket !== null && Socket.readyState === WebSocket.CLOSED) {
        Socket.close()
        Socket = null
        createSocket(wsUrl)
    } else if (Socket.readyState === WebSocket.OPEN) {
        Socket.send(JSON.stringify(message))
    } else if (Socket.readyState === WebSocket.CONNECTING) {
        connecting(message)
    }
}


/**发送心跳
 * @param {number} time 心跳间隔毫秒 默认5000
 * @param {string} ping 心跳名称 默认字符串ping
 */
export const sendPing = (time = 1110000, ping = 'ping') => {
    clearInterval(setIntervalWebsocketPush)
    ping = JSON.stringify(ping)
    Socket.send(ping)
    setIntervalWebsocketPush = setInterval(() => {
        Socket.send(ping)
    }, time)
}

