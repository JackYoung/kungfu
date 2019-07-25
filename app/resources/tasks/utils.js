const readline = require('readline');
const fs = require('fs'); 
  
//建立固定条数的list数据结构
function buildListByLineNum(num){
    function ListByNum(n){
        this.list = [];
        this.len = 0;
        this.num = n;
    }
    ListByNum.prototype.insert = function(item){
        const t = this;
        if(t.len >= t.num) t.list.shift();
        else t.len++
        t.list.push(item)
    }
    return new ListByNum(num)
}

function dealMessage(line, searchKeyword){
    let lineData;
    try{
        lineData = JSON.parse(line);
    }catch(err){
        console.error(err)
        return false;
    }
    const message = lineData.message;
    //message 提取 ‘\n’ 再循环
    return message.split('\n[').map((m,i) => {
        if(!m.length) return false;
        if(i > 0) m = '[' + m;
        const messageList = m.split(']')
        const len = messageList.length;
        let messageData = {}
        switch(len){
            case 5:
                messageData = {
                    updateTime: messageList[0].trim().slice(1).trim(),
                    type: messageList[1].trim().slice(1).trim(),
                    pid: messageList[2].slice(messageList[2].indexOf('pid/tid') + 7).trim(),
                    action: messageList[3].trim().slice(1).trim(),
                    message: messageList[4].trim()
                }
                break;
            case 4:
                messageData = {
                    updateTime: messageList[0].trim().slice(1).trim(),
                    type: messageList[1].trim().slice(1).trim(),
                    action: messageList[2].trim().slice(1).trim(),
                    message: messageList[3].trim(),
                }
                break;
            default:
                if(len < 4){
                    const type = lineData.type === 'err' ? 'error' 
                        : lineData.type === 'out' ? 'info' : lineData.type;
                    messageData = {
                        updateTime: lineData.timestamp,
                        type,
                        pid: '',
                        action: '',
                        message
                    }
                }else{
                    messageData = {
                        updateTime: messageList[0].trim().slice(1).trim(),
                        type: messageList[1].trim().slice(1).trim(),
                        pid: messageList[2].slice(messageList[2].indexOf('pid/tid') + 7).trim(),
                        action: messageList[3].trim().slice(1).trim(),
                        message: messageList.slice(4).join(']').trim()
                    }
                }
        }
        if(searchKeyword && messageData.message.indexOf(searchKeyword) === -1 ){
            if(messageData.type.indexOf(searchKeyword) === -1){
                return false;
            }
        }
        return messageData
    })
}

function dealMessage2(line) {
    let lineData;
    try{
        lineData = JSON.parse(line);
    }catch(err){
        console.error(err)
        return false;
    }
    const message = lineData.message.split('\n[').join('<br\>[')
    return [ { message } ]
}

function getLog(logPath, searchKeyword, dealMessageFunc){
    const numList = buildListByLineNum(201);    
    let logId = 0;            
    return new Promise((resolve, reject) => {
        fs.stat(logPath, (err,res) => {
            if(err){
                reject(err)
                return;
            }

            const lineReader = readline.createInterface({
                input: fs.createReadStream(logPath)
            })

            lineReader.on('line', line => {
                const messageData = dealMessageFunc(line, searchKeyword)
                if(!messageData) return;
                messageData.forEach(msg => {
                    if(!msg) return;
                    logId++
                    numList.insert({
                        ...msg,
                        id: logId
                    })
                })
            })

            lineReader.on('close', () => {
                resolve(numList)
            })
        })
    })
}

exports.getLog = getLog;
exports.dealMessage = dealMessage;
exports.dealMessage2 = dealMessage2;
