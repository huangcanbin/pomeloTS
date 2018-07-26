import sys
import threading
from pypomelo.tornadoclient import TornadoClient as Client
from pypomelo.handler import Handler
import tornado.ioloop

if __name__ == '__main__' :
    if len(sys.argv) < 3 :
        print "usage python %s host port" %(sys.argv[0])
        sys.exit(1)

    class ClientHandler(Handler) :
        def connectGate(self, client):
            req_data = {
                "seq": 1,
                "ts": 1520316857,
                "data": {
                    "thirdType":
                    0,
                    "token":
                    "ce1c2d86c5614c7571d1845f6fb7c774d847ec122fc39bc34cbdc1907e3210eb"
                },
                "sign": "xxxxxxxxxxxxxxxxxxxx"
            }
            client.send_request("gate.gateHandler.dispatch", req_data)

        def on_recv_data(self, client, proto_type, data) :
            return data

        def on_connected(self, client, user_data) :
            print "connected ok..."
            # client.send_heartbeat()
            self.connectGate(client)

        def on_heartbeat(self, client):
            print "heartbeat send..."


        def on_response(self, client, route, request, response) :
            print "response..."
            print response

        def on_push(self, client, route, push_data) :
            print "push..."
            print route, " = ", push_data

        def on_disconnect(self, client) :
            print "disconnect..."


    host = sys.argv[1]
    port = sys.argv[2]
    #Start some client
    for i in range(1) :
        handler = ClientHandler()
        client = Client(handler)
        client.connect(host, int(port))
    tornado.ioloop.IOLoop.current().start()