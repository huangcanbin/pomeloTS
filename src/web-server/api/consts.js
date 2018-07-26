
var Consts = {
    RES_CODE: {
        SUC_OK: 200,
        ERR_FAIL: 500
    },
    RES_MSG:{
        ERR_FAIL: '服务器出错',
        ERR_LOGIN_NO_USER: '账号不存在',
        ERR_LOGIN_PASS: '账号或密码错误',
        ERR_REG_NAME_EXIST: '注册账号已经存在',
        ERR_USER_NAME: '账号只能是字母或数字组合',
        ERR_USER_NAME_LENGTH: '账号至少6位字母或数字组合',
    }
}

module.exports = Consts;