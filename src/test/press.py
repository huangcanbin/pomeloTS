import os
import sys
import random
import datetime
import logging
import math
import time
import threading
from gevent import monkey
monkey.patch_all()
import gevent
import libs.operation_csv as operation_csv
from clienthandle import ClientHandler
from accountclient import AccountClient
from pypomelo.tornadoclient import TornadoClient as Client

account_url = "http://192.168.9.172:8080/auth"
server_host = "192.168.9.172"
server_port = 7660
target_number = 1
time_count = 300
user_count = 100
show_log = True

#
users = []
record_dict = []
use_time = []  # 耗费时间
tps_count = []  # tps统计数字
last_index = 0  # 上一次统计索引
error_count = 0  # 错误统计数据
time_count = 300  # 持续时间
lock = threading.Lock()  # 索引锁
continue_test = True  # 持续测试

logging.basicConfig(
    level=logging.DEBUG,
    format=
    '%(asctime)s - %(filename)s[line:%(lineno)d] - %(levelname)s :%(message)s')


def bat_init(norm_test, filename):
    global target_number
    if norm_test:
        for i in range(target_number):
            uid = 1000 + i
            account = AccountClient(account_url, uid, 0)
            account.setPassword('123456')
            if account.loginAccount():
                handler = ClientHandler(account)
                client = Client(handler)
                client.connect(server_host, server_port)
                users.append(client)
    else:
        try:
            config_users = operation_csv.read(filename)
            if len(config_users) < target_number:
                target_number = len(config_users)

            for i in range(target_number):
                account = AccountClient(account_url, config_users[i][0],
                                        config_users[i][1])
                account.setPassword('123456')
                if account.loginAccount():
                    handler = ClientHandler(account)
                    client = Client(handler)
                    client.connect(server_host, server_port)
                    users.append(client)
        except Exception, e:
            print e.message


def bat_execute_calculate(func):
    global error_count
    global cur_index
    global last_index
    global tps_count

    cur_index = 0
    tps_count = []  # tps统计数字
    last_index = 0  # 上一次统计索引
    error_count = 0  # 错误统计数据

    logging.info("<-----------%s start ---------->" % func)

    greenlets = []
    for user in users:
        greenlets.append(gevent.spawn(eval("user." + func)))
    greenlets.append(gevent.spawn(calc_count))
    greenlets.append(gevent.spawn(calc_tps))
    #greenlets.append(gevent.spawn(continue_time))
    start = time.time()

    # 开始tps计算
    # t1 = threading.Thread(target=calc_tps, args=())
    # t1.setDaemon(True)
    # t1.start()

    gevent.joinall(greenlets)
    diff = time.time() - start

    logging.info("easy time, please keep ease, sleep 2 second")
    time.sleep(2)

    # 计算内容
    record_dict
    logging.info('all work complete using time %.3f sec' % diff)
    logging.info("max_time : %0.6f sec" % max(use_time))
    logging.info("min_time : %0.6f sec" % min(use_time))
    logging.info("avg_time : %0.6f sec" % (sum(use_time) / len(use_time)))
    logging.info("error_count : %d" % (error_count))
    logging.info("client avg handle time : %.6f sec" % (diff / target_number))

    #可能服务端执行过快导致tps统计不了，这个时候就认为是最大值
    if len(tps_count) == 0:
        if change:
            tps_count.append(0)  # 发生什么错误的事情
        else:
            tps_count.append(target_number)  # 太快来不及统计了

    logging.info("max tps : %0.6f tick" % max(tps_count))
    logging.info("min tps : %0.6f tick" % min(tps_count))
    logging.info("avg tps : %0.6f tick" % (sum(tps_count) / len(tps_count)))
    logging.info("clear current context")
    del use_time[:]
    del tps_count[:]
    logging.info("<-----------%s end ---------->" % func)


if __name__ == '__main__':
    bat_init(False, "./src/test/config/official_user.csv")
    # bat_init(False, "./config/official_user.csv")

    filename = "record.%s.csv" % (
        time.strftime('%Y_%m_%d_%H%M%S', time.localtime(time.time())))
    operation_csv.write_dict("./config/"+filename, record_dict, True)