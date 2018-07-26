::npm-install.bat
@echo off
::install web server dependencies && game server dependencies
cd web-server && npm install -d && cd .. && cd game-server && npm install -d

::attach install three-lib
cd web-server 
npm install express
npm install errorhandler
npm install method-override
npm install body-parser
npm install node-notifier
npm install generic-pool -g
npm install mysql -g
npm install mongodb -g

cd game-server
npm install crc
npm install pomelo-logger --save
npm install async --save