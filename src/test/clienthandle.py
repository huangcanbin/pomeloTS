import sys
import logging
import json
from libs.http_utils import HttpUtils, eRequestType
from pypomelo.handler import Handler


class ClientHandler(Handler):
    def __init__(self, accountClient):
        self.__msg_id = 0
        self.__account = accountClient

    def incSeq(self):
        self.__msg_id = self.__msg_id + 1
        return self.__msg_id

    def connectGate(self, client):
        req_data = {
            "seq": self.incSeq(),
            "ts": 1520316857,
            "data": {
                "thirdType": self.__account,
                "token": self.__account.getToken()
            },
            "sign": ""
        }
        client.send_request("gate.gateHandler.dispatch", req_data)

    def on_recv_data(self, client, proto_type, data):
        return data

    def on_connected(self, client, user_data):
        print "connected ok..."
        # client.send_heartbeat()
        self.connectGate(client)

    def on_heartbeat(self, client):
        print "heartbeat send..."

    def on_response(self, client, route, request, response):
        print "response..."
        print response

    def on_push(self, client, route, push_data):
        print "push..."
        print route, " = ", push_data

    def on_disconnect(self, client):
        print "disconnect..."
