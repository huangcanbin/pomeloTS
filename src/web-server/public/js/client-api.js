var elements = ['loginPanel', 'mainPanel', 'apiResultPanel'];
var pomelo = window.pomelo;
var host = window.location.hostname;//"192.168.181.53";//
var port = "7660";
var token = '';
var uid = 0;
var playerAreas = [];
var areaId = 0;
var player = {};

function showPanel(id) {
    for (var i = 0; i < elements.length; i++) {
        var elem = document.getElementById(elements[i]);
        elem.style.display = 'none';
    }
    document.getElementById(id).style.display = 'block';
}

function showResult(msg) {
    var panel = document.getElementById('apiResultPanel');
    panel.style.display = 'block';
    panel.innerHTML = msg;
}

function showPlayer() {
    var html = '<p>Uid:' + uid
        + ', 角色名:' + (player.name || '')
        + '] 大区：' + areaId + '</p>';
    document.getElementById('rolePanel').innerHTML = html;
}
function printError(data) {
    var html = '<h3>' + data.code + '-' + (data.msg || '') + '</h3>';
    if (data.code !== 200) {
        showResult(html);
        return;
    }
    return html;
}

function login() {
    token = document.getElementById('itToken').value;
    entry();
}
function entry() {
    pomelo.init({
        host: host,
        port: port,
        log: true
    }, function () {
        var post = {
            token: token,
            channel: 1
        };
        pomelo.request("gate.gateHandler.queryEntry", post, function (data) {
            pomelo.disconnect();
            if (data.code !== 200) {
                alert('Connect gate server error:' + data.msg);
                return;
            }
            //connector
            pomelo.init({
                host: data.host,
                port: data.port,
                log: true
            }, function () {
                var post = { token: token };
                pomelo.request('connector.entryHandler.entry', post, function (data) {
                    if (data.code !== 200) {
                        alert('Connect connector server error:' + data.msg);
                        return;
                    }
                    console.log('login success, uid:' + data.uid);
                    player.id = uid = data.uid;
                    var area = data.areas.length > 0 ? data.areas[0] : { id: 0, playerId: 0 };
                    areaId = area.id;
                    // player.id = area.playerId;
                    pomelo.on('onRepeatLogin', function (data) {
                        alert(data.msg);
                    });

                    pomelo.on('onRedPoint', function (data) {
                        alert("data.type = " + data.type + " data.id = " + data.id + " data.status = " + data.status);
                    });

                    showPlayer();
                    showPanel('mainPanel');
                });
            }/* , true */);
        });
    });
};

function onAreaQuery() {
    var post = {
        page: 1,
        size: 10,
        channel: 1
    };
    pomelo.request('connector.areaHandler.query', post, function (data) {
        var html = printError(data);
        if (!html) {
            return;
        }
        for (var i = 0; i < data.areas.length; i++) {
            var area = data.areas[i];
            if (i === 0) areaId = area.id;//entry first area
            var status = area.status === 2 ? '维护中'
                : area.status === 3 ? '新服'
                    : area.status === 4 ? '热服'
                        : area.status === 5 ? '爆满'
                            : '新';
            html += '<p><a href="#" onclick="onSelectArea(' + area.id + ')">' + area.no + '. ' + area.name + '[' + status + ']</a></p>'
        }

        showPlayer();
        showResult(html);
    });
}

function onSelectArea(id) {
    areaId = id;
    // playerAreas.forEach(function (area) {
    //     if (area.id === areaId) {
    //         player.id = area.playerId;
    //     }
    // }, this);
    showPlayer();
    showPanel('mainPanel');
}

function onConfigCheck() {
    var post = {
    };
    pomelo.request('area.playerHandler.configCheck', post, function (data) {
        var html = printError(data);
        if (!html) {
            return;
        }

        html += '<p>player:' + JSON.stringify(data) + '</p>'
        showPlayer();
        showResult(html);
    });
}

function onConfigGet() {
    var post = {
    };
    pomelo.request('area.playerHandler.configGet', post, function (data) {
        var html = printError(data);
        if (!html) {
            return;
        }

        html += '<p>player:' + JSON.stringify(data) + '</p>'
        showPlayer();
        showResult(html);
    });
}

function onCreateRole() {
    var post = {
        areaId: areaId,
        roleId: 90001,
        name: document.getElementById('itRoleName').value || ''
    };
    //'connector.roleHandler.create'
    pomelo.request('area.playerHandler.create', post, function (data) {
        var html = printError(data);
        if (!html) {
            return;
        }
        player.id = data.playerId;
        showPlayer();
        html += '<p>id:' + player.id + '. ' + post.name + '</p>'
        showResult(html);
    });
}


function onEntryScence() {
    var post = {
        playerId: player.id,
        areaId: areaId
    };
    pomelo.request('area.playerHandler.entry', post, function (data) {
        var html = printError(data);
        if (!html) {
            return;
        }
        player = data.player;
        html += '<p>player:' + JSON.stringify(data) + '</p>'
        showPlayer();
        showResult(html);
    });
}

var bossId = 0;
var checkpointId = 0;

function onBossCombotStart() {
    var post = {
    };
    pomelo.request('area.checkpointHandler.combat', post, function (data) {
        console.log(data);
        var html = printError(data);
        if (!html) {
            return;
        }
        bossId = data.bossId;
        html += '<p>checkpoint:' + JSON.stringify(data) + '</p>';

        showPlayer();
        showResult(html);
    });
}

function onBossCombotOver() {

    var post = {
        bossId: bossId,
        ability: 100
    };
    pomelo.request('area.checkpointHandler.over', post, function (data) {
        var html = printError(data);
        if (!html) {
            return;
        }
        checkpointId = data.checkpointId;
        html += '<p>checkpoint over:' + JSON.stringify(data) + '</p>'
        showPlayer();
        showResult(html);
    });
}

function onBossExtract() {

    var post = {};
    pomelo.request('area.checkpointHandler.extract', post, function (data) {
        console.log(data);
        var html = printError(data);
        if (!html) {
            return;
        }
        html += '<p>checkpoint extract:' + JSON.stringify(data) + '</p>'
        showPlayer();
        showResult(html);
    });
}

function onGetPlayerInfo() {

    var post = {};
    pomelo.request('area.playerHandler.getPlayerInfo', post, function (data) {
        var html = printError(data);
        if (!html) {
            return;
        }
        html += '<p>checkpoint extract:' + JSON.stringify(data) + '</p>'
        showPlayer();
        showResult(html);
    });
}

function onSelectedPoint() {
    var post = {
        checkpointId: document.getElementById('selectedPointId').value || '',
    };
    pomelo.request('area.checkpointHandler.selected', post, function (data) {
        var html = printError(data);
        if (!html) {
            return;
        }
        html += '<p>checkpoint extract:' + JSON.stringify(data) + '</p>'
        showPlayer();
        showResult(html);
    });
}

function onPointFindAward() {
    var post = {        
    };

    pomelo.request('area.checkpointHandler.findAward', post, function (data) {
        var html = printError(data);
        if (!html) {
            return;
        }
        html += '<p>checkpoint extract:' + JSON.stringify(data) + '</p>'
        showPlayer();
        showResult(html);
    });
}

function onPointGetAward() {
    var post = {
        awaId: document.getElementById('pointGetAwardId').value || '',
    };
    
    pomelo.request('area.checkpointHandler.getAward', post, function (data) {
        var html = printError(data);
        if (!html) {
            return;
        }
        html += '<p>checkpoint extract:' + JSON.stringify(data) + '</p>'
        showPlayer();
        showResult(html);
    });
}

function onOfflineTimes() {
    var post = {};
    
    pomelo.request('area.checkpointHandler.offlineTimes', post, function (data) {
        var html = printError(data);
        if (!html) {
            return;
        }
        html += '<p>checkpoint extract:' + JSON.stringify(data) + '</p>'
        showPlayer();
        showResult(html);
    });
}

function onEntrySummon() {
    var post = {};
    pomelo.request('area.heroHandler.entry', post, function (data) {
        var html = printError(data);
        if (!html) {
            return;
        }
        html += '<p>boss extract:' + JSON.stringify(data) + '</p>'
        showPlayer();
        showResult(html);
    });
}

function onSummonTake() {
    var el = document.getElementById('it_costType');
    costType = el.options[el.selectedIndex].value;
    var post = {
        type: costType
    };
    pomelo.request('area.heroHandler.take', post, function (data) {
        var html = printError(data);
        if (!html) {
            return;
        }
        html += '<p>hero extract:' + JSON.stringify(data) + '</p>'
        showPlayer();
        showResult(html);
    });
}

function onSummonTakeTen() {
    var el = document.getElementById('it_costType');
    costType = el.options[el.selectedIndex].value;
    var post = {
        type: costType
    };
    pomelo.request('area.heroHandler.takeTen', post, function (data) {
        var html = printError(data);
        if (!html) {
            return;
        }
        html += '<p>hero extract:' + JSON.stringify(data) + '</p>'
        showPlayer();
        showResult(html);
    });
}

function onBugEnergy() {

    var post = {
        num: 10
    };
    pomelo.request('area.checkpointHandler.buyenergy', post, function (data) {
        var html = printError(data);
        if (!html) {
            return;
        }
        html += '<p>bug energy:' + JSON.stringify(data) + '</p>'
        showPlayer();
        showResult(html);
    });
}


function onEntryGoblin() {
    var post = {};
    pomelo.request('area.goblinHandler.entry', post, function (data) {
        var html = printError(data);
        if (!html) {
            return;
        }
        html += '<p>json:' + JSON.stringify(data) + '</p>'
        showPlayer();
        showResult(html);
    });
}


function onBuyBean() {
    var post = {
        num: document.getElementById('buyBeanNum').value || ''
    };

    pomelo.request('area.goblinHandler.buy', post, function (data) {
        var html = printError(data);
        if (!html) {
            return;
        }
        html += '<p>json:' + JSON.stringify(data) + '</p>';
        showPlayer();
        showResult(html);
    });
}


function onChallengeGoblin() {
    var post = {
        bossId: document.getElementById('challengeBossId').value || ''
    };

    pomelo.request('area.goblinHandler.challenge', post, function (data) {
        var html = printError(data);
        if (!html) {
            return;
        }
        html += '<p>json:' + JSON.stringify(data) + '</p>';
        showPlayer();
        showResult(html);
    });
}

function onAttackGoblin() {
    var post = {
        remHp: document.getElementById('bossRemHp').value || ''
    };

    pomelo.request('area.goblinHandler.attack', post, function (data) {
        var html = printError(data);
        if (!html) {
            return;
        }
        html += '<p>json:' + JSON.stringify(data) + '</p>';
        showPlayer();
        showResult(html);
    });
}

function onHeroBookQuery() {
    var post = {};

    pomelo.request('area.herobookHandler.query', post, function (data) {
        var html = printError(data);
        if (!html) {
            return;
        }

        html += '<p>json:' + JSON.stringify(data) + '</p>';
        showPlayer();
        showResult(html);
    });
}

function onGetIllustrated() {
    var post = {};

    pomelo.request('area.herobookHandler.illustrated', post, function (data) {
        var html = printError(data);
        if (!html) {
            return;
        }

        html += '<p>json:' + JSON.stringify(data) + '</p>';
        showPlayer();
        showResult(html);
    });
}

function onGetIllAch() {
    var post = {};

    pomelo.request('area.herobookHandler.achievement', post, function (data) {
        var html = printError(data);
        if (!html) {
            return;
        }

        html += '<p>json:' + JSON.stringify(data) + '</p>';
        showPlayer();
        showResult(html);
    });
}

function onGetIllAchAward() {
    var post = {
        achId: document.getElementById('illAchId').value || ''
    };

    pomelo.request('area.herobookHandler.getAward', post, function (data) {
        var html = printError(data);
        if (!html) {
            return;
        }

        html += '<p>json:' + JSON.stringify(data) + '</p>';
        showPlayer();
        showResult(html);
    });
}

function onAddHeroBags() {
    var post = {};

    pomelo.request('area.herobookHandler.addHeroBags', post, function (data) {
        var html = printError(data);
        if (!html) {
            return;
        }

        html += '<p>json:' + JSON.stringify(data) + '</p>';
        showPlayer();
        showResult(html);
    });
}

function onHeroSmelt() {
    var post = {
        ids: document.getElementById('smeltHids').value || ''
    };

    pomelo.request('area.herobookHandler.smelt', post, function (data) {
        var html = printError(data);
        if (!html) {
            return;
        }

        html += '<p>json:' + JSON.stringify(data) + '</p>';
        showPlayer();
        showResult(html);
    });
}

function onLineupQuery() {
    var post = {};

    pomelo.request('area.herolineupHandler.query', post, function (data) {
        var html = printError(data);
        if (!html) {
            return;
        }

        html += '<p>json:' + JSON.stringify(data) + '</p>';
        showPlayer();
        showResult(html);
    });
}

function onLineupAdd() {
    var post = {};

    pomelo.request('area.herolineupHandler.add', post, function (data) {
        var html = printError(data);
        if (!html) {
            return;
        }

        html += '<p>json:' + JSON.stringify(data) + '</p>';
        showPlayer();
        showResult(html);
    });
}

function onLineupSetHero() {
    var post = {
        hid: document.getElementById('lineupHeroId').value || '',
        pos: document.getElementById('lineupPos').value || ''
    };

    pomelo.request('area.herolineupHandler.setHero', post, function (data) {
        var html = printError(data);
        if (!html) {
            return;
        }

        html += '<p>json:' + JSON.stringify(data) + '</p>';
        showPlayer();
        showResult(html);
    });
}


function onCultivate() {
    var post = {
        pos: document.getElementById('cultivatePos').value || '',
        type: document.getElementById('cultivateType').value || ''
    };

    pomelo.request('area.herocultivateHandler.intensify', post, function (data) {
        var html = printError(data);
        if (!html) {
            return;
        }

        html += '<p>json:' + JSON.stringify(data) + '</p>';
        showPlayer();
        showResult(html);
    });
}

function onGetIntensifyCost() {
    var post = {
        pos: document.getElementById('intensifyCostPos').value || '',
        type: document.getElementById('intensifyCostType').value || ''
    };

    pomelo.request('area.herocultivateHandler.getIntensifyCost', post, function (data) {
        var html = printError(data);
        if (!html) {
            return;
        }

        html += '<p>json:' + JSON.stringify(data) + '</p>';
        showPlayer();
        showResult(html);
    });
}

function onLineupOneButUpg() {
    var post = {
        pos: document.getElementById('lineupOneButUpgPos').value || '',
    };

    pomelo.request('area.herocultivateHandler.lineupOneButUpg', post, function (data) {
        var html = printError(data);
        if (!html) {
            return;
        }

        html += '<p>json:' + JSON.stringify(data) + '</p>';
        showPlayer();
        showResult(html);
    });
}

function onUseItem() {
    var post = {
        itemId: document.getElementById('userItemId').value || ''
    };

    pomelo.request('area.bagHandler.useItem', post, function (data) {
        var html = printError(data);
        if (!html) {
            return;
        }

        html += '<p>json:' + JSON.stringify(data) + '</p>';
        showPlayer();
        showResult(html);
    });
}

function onQueryBags() {
    var post = {
    };

    pomelo.request('area.bagHandler.queryBags', post, function (data) {
        var html = printError(data);
        if (!html) {
            return;
        }

        html += '<p>json:' + JSON.stringify(data) + '</p>';
        showPlayer();
        showResult(html);
    });
}

function onComposeItem() {
    var post = {
        itemId: document.getElementById('composeItemId').value || ''
    };

    pomelo.request('area.bagHandler.composeItem', post, function (data) {
        var html = printError(data);
        if (!html) {
            return;
        }

        html += '<p>json:' + JSON.stringify(data) + '</p>';
        showPlayer();
        showResult(html);
    });
}

function onVendItem() {
    var post = {
        itemId: document.getElementById('vendItemId').value || '',
        num: document.getElementById('vendNum').value || ''
    };

    pomelo.request('area.bagHandler.vendItem', post, function (data) {
        var html = printError(data);
        if (!html) {
            return;
        }

        html += '<p>json:' + JSON.stringify(data) + '</p>';
        showPlayer();
        showResult(html);
    });
}

function onBuyItem() {
    var post = {
        itemId: document.getElementById('buyItemId').value || '',
    };

    pomelo.request('area.shopHandler.buyItem', post, function (data) {
        var html = printError(data);
        if (!html) {
            return;
        }

        html += '<p>json:' + JSON.stringify(data) + '</p>';
        showPlayer();
        showResult(html);
    });
}

function onAddBags() {
    var post = {
        type: document.getElementById('addBagsType').value || ''
    };

    pomelo.request('area.bagHandler.addBags', post, function (data) {
        var html = printError(data);
        if (!html) {
            return;
        }

        html += '<p>json:' + JSON.stringify(data) + '</p>';
        showPlayer();
        showResult(html);
    });
}

function onShopHero() {
    var post = {
    };

    pomelo.request('area.shopHandler.hero', post, function (data) {
        var html = printError(data);
        if (!html) {
            return;
        }

        html += '<p>json:' + JSON.stringify(data) + '</p>';
        showPlayer();
        showResult(html);
    });
}

function onExchangeHero() {
    var post = {
        heroId: document.getElementById('exchangeHeroId').value || '',
    };

    pomelo.request('area.shopHandler.exchangeHero', post, function (data) {
        var html = printError(data);
        if (!html) {
            return;
        }

        html += '<p>json:' + JSON.stringify(data) + '</p>';
        showPlayer();
        showResult(html);
    });
}

function onRefreshHero() {
    var post = {
    };

    pomelo.request('area.shopHandler.refreshHero', post, function (data) {
        var html = printError(data);
        if (!html) {
            return;
        }

        html += '<p>json:' + JSON.stringify(data) + '</p>';
        showPlayer();
        showResult(html);
    });
}

function onShopItem() {
    var post = {
    };

    pomelo.request('area.shopHandler.item', post, function (data) {
        var html = printError(data);
        if (!html) {
            return;
        }

        html += '<p>json:' + JSON.stringify(data) + '</p>';
        showPlayer();
        showResult(html);
    });
}

function onIdentification() {
    var post = {
        name: document.getElementById('identName').value || '',
        idNumber: document.getElementById('identIDNumber').value || ''
    };

    pomelo.request('area.antiaddictionHandler.identification', post, function (data) {
        var html = printError(data);
        if (!html) {
            return;
        }

        html += '<p>json:' + JSON.stringify(data) + '</p>';
        showPlayer();
        showResult(html);
    });
}

function onVipCardGetUseInfo() {
    var post = {
    };

    pomelo.request('area.vipCardHandler.getUseInfo', post, function (data) {
        var html = printError(data);
        if (!html) {
            return;
        }

        html += '<p>json:' + JSON.stringify(data) + '</p>';
        showPlayer();
        showResult(html);
    });
}

function onVipCardGetPriceAndAward() {
    var post = {
    };

    pomelo.request('area.vipCardHandler.getPriceAndAward', post, function (data) {
        var html = printError(data);
        if (!html) {
            return;
        }

        html += '<p>json:' + JSON.stringify(data) + '</p>';
        showPlayer();
        showResult(html);
    });
}

function onVipCardBuy() {
    var post = {
        type: document.getElementById('buyCardType').value || '',
    };

    pomelo.request('area.vipCardHandler.buy', post, function (data) {
        var html = printError(data);
        if (!html) {
            return;
        }

        html += '<p>json:' + JSON.stringify(data) + '</p>';
        showPlayer();
        showResult(html);
    });
}

function onVipCardGetAward() {
    var post = {
        type: document.getElementById('getAwardCardType').value || '',
    };

    pomelo.request('area.vipCardHandler.getAward', post, function (data) {
        var html = printError(data);
        if (!html) {
            return;
        }

        html += '<p>json:' + JSON.stringify(data) + '</p>';
        showPlayer();
        showResult(html);
    });
}

function onGetTask() {
    var post = {
    };

    pomelo.request('area.taskHandler.get', post, function (data) {
        var html = printError(data);
        if (!html) {
            return;
        }

        html += '<p>json:' + JSON.stringify(data) + '</p>';
        showPlayer();
        showResult(html);
    });
}

function onGetTaskAward() {
    var post = {
    };

    pomelo.request('area.taskHandler.getAward', post, function (data) {
        var html = printError(data);
        if (!html) {
            return;
        }

        html += '<p>json:' + JSON.stringify(data) + '</p>';
        showPlayer();
        showResult(html);
    });
}

function onGetStatus() {
    var post = {
    };

    pomelo.request('area.taskHandler.getStatus', post, function (data) {
        var html = printError(data);
        if (!html) {
            return;
        }

        html += '<p>json:' + JSON.stringify(data) + '</p>';
        showPlayer();
        showResult(html);
    });
}

function onRechargeGetStatus() {
    var post = {
    };

    pomelo.request('area.rechargeHandler.getStatus', post, function (data) {
        var html = printError(data);
        if (!html) {
            return;
        }

        html += '<p>json:' + JSON.stringify(data) + '</p>';
        showPlayer();
        showResult(html);
    });
}

function onRechargeGet() {
    var post = {
    };

    pomelo.request('area.rechargeHandler.get', post, function (data) {
        var html = printError(data);
        if (!html) {
            return;
        }

        html += '<p>json:' + JSON.stringify(data) + '</p>';
        showPlayer();
        showResult(html);
    });
}

function onRechargeGetAward() {
    var post = {
    };

    pomelo.request('area.rechargeHandler.getAward', post, function (data) {
        var html = printError(data);
        if (!html) {
            return;
        }

        html += '<p>json:' + JSON.stringify(data) + '</p>';
        showPlayer();
        showResult(html);
    });
}

function onRecharge() {
    var post = {
        money: document.getElementById('rechargeMoney').value || '',
        type: document.getElementById('Rebatetype').value || '',
        id: document.getElementById('Rebateid').value || '',
        pointid: document.getElementById('pointlotteryid').value || '',
    };

    pomelo.request('area.rechargeHandler.recharge', post, function (data) {
        var html = printError(data);
        if (!html) {
            return;
        }

        html += '<p>json:' + JSON.stringify(data) + '</p>';
        showPlayer();
        showResult(html);
    });
}

function onTowerGetTower() {
    var post = {
    };

    pomelo.request('area.towerHandler.getTower', post, function (data) {
        var html = printError(data);
        if (!html) {
            return;
        }

        html += '<p>json:' + JSON.stringify(data) + '</p>';
        showPlayer();
        showResult(html);
    });
}

function onTowerCombat() {
    var post = {
    };

    pomelo.request('area.towerHandler.combat', post, function (data) {
        var html = printError(data);
        if (!html) {
            return;
        }

        html += '<p>json:' + JSON.stringify(data) + '</p>';
        showPlayer();
        showResult(html);
    });
}

function onTowerReset() {
    var post = {
    };

    pomelo.request('area.towerHandler.reset', post, function (data) {
        var html = printError(data);
        if (!html) {
            return;
        }

        html += '<p>json:' + JSON.stringify(data) + '</p>';
        showPlayer();
        showResult(html);
    });
}

function onTowerSweep() {
    var post = {
    };

    pomelo.request('area.towerHandler.sweep', post, function (data) {
        var html = printError(data);
        if (!html) {
            return;
        }

        html += '<p>json:' + JSON.stringify(data) + '</p>';
        showPlayer();
        showResult(html);
    });
}

function onSignShowAward() {
    var post = {
    };

    pomelo.request('area.checksignHandler.findAward', post, function (data) {
        var html = printError(data);
        if (!html) {
            return;
        }

        html += '<p>json:' + JSON.stringify(data) + '</p>';
        showPlayer();
        showResult(html);
    });
}

function onSignGetAward() {
    var post = {
    };

    pomelo.request('area.checksignHandler.getAward', post, function (data) {
        var html = printError(data);
        if (!html) {
            return;
        }

        html += '<p>json:' + JSON.stringify(data) + '</p>';
        showPlayer();
        showResult(html);
    });
}

function onSignGetVipAward() {
    var post = {
    };

    pomelo.request('area.checksignHandler.getVipAward', post, function (data) {
        var html = printError(data);
        if (!html) {
            return;
        }

        html += '<p>json:' + JSON.stringify(data) + '</p>';
        showPlayer();
        showResult(html);
    });
}

function onSignGetAccuAward() {
    var post = {
        day: document.getElementById('accuday').value,
    };

    pomelo.request('area.checksignHandler.getAccuAward', post, function (data) {
        var html = printError(data);
        if (!html) {
            return;
        }

        html += '<p>json:' + JSON.stringify(data) + '</p>';
        showPlayer();
        showResult(html);
    });
}

function onGetRankInfo() {
    var post = {
    };

    pomelo.request('area.playerHandler.getRankInfo', post, function (data) {
        var html = printError(data);
        if (!html) {
            return;
        }

        html += '<p>json:' + JSON.stringify(data) + '</p>';
        showPlayer();
        showResult(html);
    });
}

function onExchangeItem() {
    var post = {
        id: document.getElementById('exchangeid').value || 1,
        num: document.getElementById('exchangenum').value || '',
    };

    pomelo.request('area.exchangeHandler.exchangeItems', post, function (data) {
        var html = printError(data);
        if (!html) {
            return;
        }

        html += '<p>json:' + JSON.stringify(data) + '</p>';
        showPlayer();
        showResult(html);
    });
}

function onExchangeHero() {
    var post = {
        id: document.getElementById('exchangeid').value || 1,
        num: document.getElementById('exchangenum').value || '',
    };

    pomelo.request('area.exchangeHandler.exchangeHeros', post, function (data) {
        var html = printError(data);
        if (!html) {
            return;
        }

        html += '<p>json:' + JSON.stringify(data) + '</p>';
        showPlayer();
        showResult(html);
    });
}


function onOnceRechargeGetAward() {
    var post = {
        awaId: document.getElementById('pointGetAwardId').value || '',
    };

    pomelo.request('area.checkpointHandler.getOnceAward', post, function (data) {
        var html = printError(data);
        if (!html) {
            return;
        }

        html += '<p>json:' + JSON.stringify(data) + '</p>';
        showPlayer();
        showResult(html);
    });
}

function onheropiecerainget() {
    var post = {
        
    };

    pomelo.request('area.heroPieceRainHandler.checkHeroPieces', post, function (data) {
        var html = printError(data);
        if (!html) {
            return;
        }

        html += '<p>json:' + JSON.stringify(data) + '</p>';
        showPlayer();
        showResult(html);
    });
}

function onheropiecerainaward() {
    var post = {
        num: document.getElementById('piecenum').value || '',
        rnum: document.getElementById('piecenum1').value || '',
        srnum: document.getElementById('piecenum2').value || '',
        ssrnum: document.getElementById('piecenum3').value || '',
        rssrnum: document.getElementById('piecenum4').value || '',
    };

    pomelo.request('area.heroPieceRainHandler.getHeroPieces', post, function (data) {
        var html = printError(data);
        if (!html) {
            return;
        }

        html += '<p>json:' + JSON.stringify(data) + '</p>';
        showPlayer();
        showResult(html);
    });
}

function onBossCombat() {
    var post = {
        stageId: document.getElementById('stageid').value || 1000,
    };

    pomelo.request('area.checkpointHandler.bossCombat', post, function (data) {
        var html = printError(data);
        if (!html) {
            return;
        }

        html += '<p>checkpoint bossCombat:' + JSON.stringify(data) + '</p>'
        showPlayer();
        showResult(html);
    });
}

function onSendMaile() {
    var post = {
        title: document.getElementById('title').value || '',
        content: document.getElementById('content').value || '',
    };

    pomelo.request('area.mailHandler.sendMail', post, function (data) {
        var html = printError(data);
        if (!html) {
            return;
        }

        html += '<p>json:' + JSON.stringify(data) + '</p>';
        showPlayer();
        showResult(html);
    });
}

function onGetMail() {
    var post = {
        
    };

    pomelo.request('area.mailHandler.findMails', post, function (data) {
        var html = printError(data);
        if (!html) {
            return;
        }

        html += '<p>json:' + JSON.stringify(data) + '</p>';
        showPlayer();
        showResult(html);
    });
}

function onReadMail() {
    var post = {
        id: document.getElementById('mailid').value || '',
    };

    pomelo.request('area.mailHandler.readMail', post, function (data) {
        var html = printError(data);
        if (!html) {
            return;
        }

        html += '<p>json:' + JSON.stringify(data) + '</p>';
        showPlayer();
        showResult(html);
    });
}

function onDelMail() {
    var post = {
        id: document.getElementById('mailid').value || '',
    };

    pomelo.request('area.mailHandler.delMail', post, function (data) {
        var html = printError(data);
        if (!html) {
            return;
        }

        html += '<p>json:' + JSON.stringify(data) + '</p>';
        showPlayer();
        showResult(html);
    });
}

function onGetMailAward() {
    var post = {
        id: document.getElementById('mailid').value || '',
    };

    pomelo.request('area.mailHandler.getMailAward', post, function (data) {
        var html = printError(data);
        if (!html) {
            return;
        }

        html += '<p>json:' + JSON.stringify(data) + '</p>';
        showPlayer();
        showResult(html);
    });
}

function onFindFirstOnlineAward() {
    var post = {
        type: document.getElementById('firstonlinetype').value || '',
    };

    pomelo.request('area.firstOnlineAwardHandler.findAward', post, function (data) {
        var html = printError(data);
        if (!html) {
            return;
        }

        html += '<p>json:' + JSON.stringify(data) + '</p>';
        showPlayer();
        showResult(html);
    });
}

function onGetFirstOnlineAward() {
    var post = {
        type: document.getElementById('firstonlinetype').value || '',
        id: document.getElementById('firstonlineday').value || '',
    };

    pomelo.request('area.firstOnlineAwardHandler.getAward', post, function (data) {
        var html = printError(data);
        if (!html) {
            return;
        }

        html += '<p>json:' + JSON.stringify(data) + '</p>';
        showPlayer();
        showResult(html);
    });
}

function onGetRedPointInfo() {
    var post = {
        
    };

    pomelo.request('area.redPointHandler.getRedPointInfo', post, function (data) {
        var html = printError(data);
        if (!html) {
            return;
        }

        html += '<p>json:' + JSON.stringify(data) + '</p>';
        showPlayer();
        showResult(html);
    });
}

function onUpRedPointStatus() {
    var post = {
        type: document.getElementById('rpType').value || '',
        id: document.getElementById('rpId').value || '',
        status: document.getElementById('rpStatus').value || '',
    };

    pomelo.request('area.redPointHandler.upStatus', post, function (data) {
        var html = printError(data);
        if (!html) {
            return;
        }

        html += '<p>json:' + JSON.stringify(data) + '</p>';
        showPlayer();
        showResult(html);
    });
}
function onFindFirstRechargeRebate() {
    var post = {

    };

    pomelo.request('area.rechargeRebateHandler.findAward', post, function (data) {
        var html = printError(data);
        if (!html) {
            return;
        }

        html += '<p>json:' + JSON.stringify(data) + '</p>';
        showPlayer();
        showResult(html);
    });
}

function onGetFirstRechargeRebate() {
    var post = {
        type: document.getElementById('Rebatetype').value || '',
        id: document.getElementById('Rebateid').value || '',
    };

    pomelo.request('area.rechargeRebateHandler.getAward', post, function (data) {
        var html = printError(data);
        if (!html) {
            return;
        }

        html += '<p>json:' + JSON.stringify(data) + '</p>';
        showPlayer();
        showResult(html);
    });
}

function onFindLifeLikeByLevel() {
    var post = {
        level: document.getElementById('llLevel').value || '',
    };

    pomelo.request('area.lifeLikeHandler.getLifeLikeByLevel', post, function (data) {
        var html = printError(data);
        if (!html) {
            return;
        }

        html += '<p>json:' + JSON.stringify(data) + '</p>';
        showPlayer();
        showResult(html);
    });
}

function onOpenLifeLikeByLevel() {
    var post = {
        level: document.getElementById('llLevel').value || '',
    };

    pomelo.request('area.lifeLikeHandler.openLifeLikeBylevel', post, function (data) {
        var html = printError(data);
        if (!html) {
            return;
        }

        html += '<p>json:' + JSON.stringify(data) + '</p>';
        showPlayer();
        showResult(html);
    });
}

function onLifeLikeByBall() {
    var post = {
        level: document.getElementById('llLevel').value || '',
        ballid: document.getElementById('llBall').value || '',
    };

    pomelo.request('area.lifeLikeHandler.developLifeLike', post, function (data) {
        var html = printError(data);
        if (!html) {
            return;
        }

        html += '<p>json:' + JSON.stringify(data) + '</p>';
        showPlayer();
        showResult(html);
    });
}


function onGetVipConfig() {
    var post = {
    
    };

    pomelo.request('area.playerHandler.getVipConfig', post, function (data) {
        var html = printError(data);
        if (!html) {
            return;
        }

        html += '<p>json:' + JSON.stringify(data) + '</p>';
        showPlayer();
        showResult(html);
    });
}

function onIllAchCfg() {
    var post = {
    };

    pomelo.request('area.herobookHandler.illAchCfg', post, function (data) {
        var html = printError(data);
        if (!html) {
            return;
        }

        html += '<p>json:' + JSON.stringify(data) + '</p>';
        showPlayer();
        showResult(html);
    });
}

function onRankedGameEntry() {
    var post = {

    };


    pomelo.request('area.rankedGameHandler.entry', post, function (data) {
        var html = printError(data);
        if (!html) {
            return;
        }

        html += '<p>json:' + JSON.stringify(data) + '</p>';
        showPlayer();
        showResult(html);
    });
}

function onRankedGameCombat() {
    var post = {
        isRobot: document.getElementById('isRobot').value || '',
        id: document.getElementById('rankedGameId').value || '',
        isChallenge: document.getElementById('isChallenge').value || '',
    };

    pomelo.request('area.rankedGameHandler.combat', post, function (data) {
        var html = printError(data);
        if (!html) {
            return;
        }

        html += '<p>json:' + JSON.stringify(data) + '</p>';
        showPlayer();
        showResult(html);
    });
}

function onRankedGameBuy() {
    var post = {

    };

    pomelo.request('area.rankedGameHandler.buy', post, function (data) {
        var html = printError(data);
        if (!html) {
            return;
        }

        html += '<p>json:' + JSON.stringify(data) + '</p>';
        showPlayer();
        showResult(html);
    });
}

function onFindRankInfo() {
    var post = {
        
    };

    pomelo.request('area.worldBossHandler.getRankInfo', post, function (data) {
        var html = printError(data);
        if (!html) {
            return;
        }

        html += '<p>json:' + JSON.stringify(data) + '</p>';
        showPlayer();
        showResult(html);
    });
}

function onFindBossInfo() {
    var post = {
        bossid: document.getElementById('worldbossid').value || '',
    };

    pomelo.request('area.worldBossHandler.getRankInfoByPlayerId', post, function (data) {
        var html = printError(data);
        if (!html) {
            return;
        }

        html += '<p>json:' + JSON.stringify(data) + '</p>';
        showPlayer();
        showResult(html);
    });
}

function onWorldBossCombat() {
    var post = {
        bossid: document.getElementById('worldbossid').value || '',
        pay: document.getElementById('worldbosspay').value || '',
    };

    pomelo.request('area.worldBossHandler.worldBossCombat', post, function (data) {
        var html = printError(data);
        if (!html) {
            return;
        }

        html += '<p>json:' + JSON.stringify(data) + '</p>';
        showPlayer();
        showResult(html);
    });
}
function onGetFirstRechargeRebate() {
    var post = {
        type: document.getElementById('Rebatetype').value || '',
        id: document.getElementById('Rebateid').value || '',
    };

    pomelo.request('area.rechargeRebateHandler.getAward', post, function (data) {
        var html = printError(data);
        if (!html) {
            return;
        }

        html += '<p>json:' + JSON.stringify(data) + '</p>';
        showPlayer();
        showResult(html);
    });
}

function onPointLottery() {
    var post = {
        pointid: document.getElementById('pointlotteryid').value || '',
        update: document.getElementById('pointlotteryupdate').value,
    };

    pomelo.request('area.heroHandler.pointLottery', post, function (data) {
        var html = printError(data);
        if (!html) {
            return;
        }

        html += '<p>json:' + JSON.stringify(data) + '</p>';
        showPlayer();
        showResult(html);
    });
}

function onPointLotteryUpdate() {
    var post = {
        pointid: document.getElementById('pointlotteryid').value || '',
    };

    pomelo.request('area.heroHandler.pointLotteryUpdate', post, function (data) {
        var html = printError(data);
        if (!html) {
            return;
        }

        html += '<p>json:' + JSON.stringify(data) + '</p>';
        showPlayer();
        showResult(html);
    });
}
function onFindRouletteRecord() {
    var post = {
        
    };

    pomelo.request('area.moneyRouletteHandler.rouletteRecord', post, function (data) {
        var html = printError(data);
        if (!html) {
            return;
        }

        html += '<p>json:' + JSON.stringify(data) + '</p>';
        showPlayer();
        showResult(html);
    });
}

function onRoulette() {
    var post = {
        money: document.getElementById('roulettemoney').value || ''
    };

    pomelo.request('area.moneyRouletteHandler.roulette', post, function (data) {
        var html = printError(data);
        if (!html) {
            return;
        }

        html += '<p>json:' + JSON.stringify(data) + '</p>';
        showPlayer();
        showResult(html);
    });
}

function onDailyTaskList() {
    var post = {
    };

    pomelo.request('area.dailyTaskHandler.get', post, function (data) {
        var html = printError(data);
        if (!html) {
            return;
        }

        html += '<p>json:' + JSON.stringify(data) + '</p>';
        showPlayer();
        showResult(html);
    });

}

function onDailyTaskAward() {
    var post = {
        awardId: document.getElementById('dailyTaskAwardId').value || ''
    };

    pomelo.request('area.dailyTaskHandler.getAward', post, function (data) {
        var html = printError(data);
        if (!html) {
            return;
        }

        html += '<p>json:' + JSON.stringify(data) + '</p>';
        showPlayer();
        showResult(html);
    });

}

function onLastDailyTaskAward() {
    var post = {
        remedialType: document.getElementById('remedialType').value || ''
    };

    pomelo.request('area.dailyTaskHandler.getLastAward', post, function (data) {
        var html = printError(data);
        if (!html) {
            return;
        }

        html += '<p>json:' + JSON.stringify(data) + '</p>';
        showPlayer();
        showResult(html);
    });

}

function onAchieveTaskList() {
    var post = {
        
    };

    pomelo.request('area.achieveTaskHandler.get', post, function (data) {
        var html = printError(data);
        if (!html) {
            return;
        }

        html += '<p>json:' + JSON.stringify(data) + '</p>';
        showPlayer();
        showResult(html);
    });

}


function onAchieveTaskAward() {
    var post = {
        taskId: document.getElementById('achieveTaskId').value || ''
    };

    pomelo.request('area.achieveTaskHandler.getAward', post, function (data) {
        var html = printError(data);
        if (!html) {
            return;
        }

        html += '<p>json:' + JSON.stringify(data) + '</p>';
        showPlayer();
        showResult(html);
    });

}
function onIllAchCfg() {
    var post = {
    };

    pomelo.request('area.herobookHandler.illAchCfg', post, function (data) {
        var html = printError(data);
        if (!html) {
            return;
        }

        html += '<p>json:' + JSON.stringify(data) + '</p>';
        showPlayer();
        showResult(html);
    });
}

function onSkillAchCfg() {
    var post = {
    };

    pomelo.request('area.herobookHandler.skillCfg', post, function (data) {
        var html = printError(data);
        if (!html) {
            return;
        }

        html += '<p>json:' + JSON.stringify(data) + '</p>';
        showPlayer();
        showResult(html);
    });
}

function onItemCfg() {
    var post = {
    };

    pomelo.request('area.bagHandler.itemCfg', post, function (data) {
        var html = printError(data);
        if (!html) {
            return;
        }

        html += '<p>json:' + JSON.stringify(data) + '</p>';
        showPlayer();
        showResult(html);
    });
}

function onHeroCfg() {
    var post = {
    };

    pomelo.request('area.herobookHandler.heroCfg', post, function (data) {
        var html = printError(data);
        if (!html) {
            return;
        }

        html += '<p>json:' + JSON.stringify(data) + '</p>';
        showPlayer();
        showResult(html);
    });
}


function onLoad() {
    showPanel('loginPanel');
}