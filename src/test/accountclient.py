import sys
import logging
import json
from libs.http_utils import HttpUtils, eRequestType


class AccountClient():
    def __init__(self, account_url, username, thirdtype):
        self.__account_url = account_url
        self.__username = username
        self.__thirdtype = thirdtype
        self.__password = ""
        self.__user_id = 0
        self.__token = ""
        self.__roles = []
        self.__proxy_host = ""
        self.__proxy_port = 0

    def getUserName(self):
        return self.__username

    def getThirdType(self):
        return self.__thirdtype

    def getToken(self):
        return self.__token

    def getUid(self):
        return self.__user_id

    def getRoles(self):
        return self.__roles

    def getproxyHost(self):
        return self.__proxy_host

    def getProxyPort(self):
        return self.__proxy_port

    def setPassword(self, password):
        self.__password = password

    def setProxy(self, host, port):
        self.__proxy_host = host
        self.__proxy_port = port


    def parseJson(self, json_raw):
        return json.loads(json_raw)

    def loginAccount(self):
        httpclient = HttpUtils()
        httpclient.SetRequestUrl(self.__account_url)
        httpclient.SetRequestMethod(eRequestType.kPost)
        httpclient.AddRequestHeader("Content-type", "application/json")
        httpclient.AddRequestHeader("Connection", "keep-alive")
        postParam = "{\"username\":\"" + str(
            self.__username) + "\",\"password\":\"" + str(
                self.__password) + "\",\"thirdtype\":" + str(
                    self.__thirdtype) + "}"

        httpclient.SetPostFields(postParam)
        code = httpclient.ExecRequest()
        if code <= 0:
            logging.critical("can't connect to server")
            httpclient.ClearRequestResource()
            return False
        elif code >= 400:
            resp = self.parseJson(httpclient.GetResponseContent())
            err_code = resp["code"]
            err_msg = resp["message"]
            logging.error(
                "server repsonse http_code = {0} error_code = {1} error_msg = {2} username = {3}".
                format(code, err_code, err_msg, self.__username))
            httpclient.ClearRequestResource()
            return False
        else:
            logging.debug("server response data : {0}".format(
                httpclient.GetResponseContent()))
            token_info = httpclient.GetResponseContent()
            account_info = self.parseJson(token_info)
            if account_info["code"] == 200:
                self.__token = account_info["data"]["token"]
                self.__user_id = account_info["data"]["uid"]
                self.__roles = account_info["data"]["roles"]
                httpclient.ClearRequestResource()
                return True

            logging.error(
                "server repsonse http_code = {0} error_code = {1} error_msg = {2} username = {3}".
                format(code, account_info["code"], account_info["msg"],
                       self.__username))
            return False
