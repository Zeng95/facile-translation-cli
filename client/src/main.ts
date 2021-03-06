import enchax from 'crypto-js/enc-hex';
import sha256 from 'crypto-js/sha256';
import { IncomingMessage } from 'http';
import https from 'https';
import md5 from 'md5';
import querystring from 'querystring';
import { v4 as uuidv4 } from 'uuid';
import { truncate } from './utils';

type BaiduResult = {
  from: string;
  to: string;
  trans_result: { src: string; dst: string }[];
  error_code?: string;
  error_msg?: string;
};

const pattern = new RegExp('[\u4E00-\u9FA5]+');
const errorMap = {
  52003: 'UNAUTHORIZED USER',
  54001: 'Invalid Sign',
  54003: '访问频率受限',
  54004: '账户余额不足',
  58002: 'Service Close',
  unknown: 'Internal Server Error'
};

const baiduTranslate = (word: string) => {
  const salt = uuidv4();
  const appId = process.env.BAIDU_APP_ID;
  const appKey = process.env.BAIDU_APP_KEY;
  const sign = md5(`${appId}${word}${salt}${appKey}`);
  const isChinese = pattern.test(word); // * Verify that it is in Chinese

  const parsedQuery: string = querystring.stringify({
    q: word,
    from: isChinese ? 'zh' : 'en',
    to: isChinese ? 'en' : 'zh',
    appid: appId,
    salt,
    sign
  });

  const options = {
    hostname: 'api.fanyi.baidu.com',
    port: 443, // * 443 - https
    path: `/api/trans/vip/translate?${parsedQuery}`,
    method: 'GET'
  };

  const request = https.request(options, (response: IncomingMessage) => {
    let chunks = [];

    response.on('data', (chunk) => {
      chunks.push(chunk);
    });

    response.on('end', () => {
      const string = Buffer.concat(chunks).toString();
      const object: BaiduResult = JSON.parse(string);
      const { error_code, error_msg } = object;

      if (error_code) {
        console.log('Error:', errorMap[error_code] || error_msg);
        process.exit(2); // * 退出当前进程
      } else {
        object.trans_result.forEach((item) => {
          console.log(item);
        });
        process.exit(0);
      }
    });
  });

  request.on('error', (e) => {
    console.log(e);
  });

  request.end();
};

const youdaoTranslate = (word: string) => {
  const salt = uuidv4();
  const appId = process.env.YOUDAO_APP_ID;
  const appKey = process.env.YOUDAO_APP_KEY;
  const curtime = Math.round(new Date().getTime() / 1000);
  const sign = sha256(`${appId}${truncate(word)}${salt}${curtime}${appKey}`).toString(enchax);
  const isChinese = pattern.test(word); // * Verify that it is in Chinese
  console.log(sign)
  const postData: string = querystring.stringify({
    q: word,
    appKey: appId,
    salt,
    from: isChinese ? 'zzh-CHS' : 'en',
    to: isChinese ? 'en' : 'zh-CHS',
    sign,
    signType: 'v3',
    curtime
  });

  const options = {
    hostname: 'openapi.youdao.com',
    port: 443, // * 443 - https
    path: '/api',
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded', // * 请求格式 - 表单
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  const request = https.request(options, (response: IncomingMessage) => {    
    let chunks = [];
    
    response.setEncoding('utf8');
    response.on('data', (chunk) => {
      chunks.push(chunk);
    });

    response.on('end', () => {
      console.log(JSON.parse(chunks[0]));
    });
  });

  request.on('error', (e) => {
    console.log(e);
  });

  request.write(postData);
  request.end();
};

const googleTranslate = (word: string) => {
  console.log(word);
};

export { baiduTranslate, youdaoTranslate, googleTranslate };
