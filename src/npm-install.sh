
npm install generic-pool -g
npm install mysql -g
npm install mongodb -g
echo '============   mysql/mongodb npm installed ============'

cd ./game-server && npm install -d

npm install crc
npm install pomelo-logger --save
npm install async --save
echo '============   game-server npm installed ============'

cd ..
cd ./web-server && npm install -d

npm install express
npm install errorhandler
npm install method-override
npm install body-parser
npm install node-notifier

echo '============   web-server npm installed ============'
