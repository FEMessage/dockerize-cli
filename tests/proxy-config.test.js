const {transformProxyConfig} = require('../utils')

const config = {
  '/api/v1': 'http://www.baidu.com',
  '/api/v2': {
    target: 'http://www.baidu.com',
    changeOrigin: true,
  },
}

const transformedConfig = {
  '/api/v1': {
    target: 'http://www.baidu.com',
    changeOrigin: true,
  },
  '/api/v2': {
    target: 'http://www.baidu.com',
    changeOrigin: true,
  },
}

test('transformProxyConfig', () => {
  expect(transformProxyConfig(config)).toStrictEqual(transformedConfig)
})
