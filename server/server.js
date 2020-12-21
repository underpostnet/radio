/**
 * Created by noamc on 8/31/14.
 */
 var binaryServer = require('binaryjs').BinaryServer,
     https = require('https'),
     wav = require('wav'),
     opener = require('opener'),
     fs = require('fs'),
     connect = require('connect'),
     serveStatic = require('serve-static'),
     UAParser = require('./ua-parser'),
     CONFIG = require("../config.json"),
     lame = require('node-lame').Lame;

 var uaParser = new UAParser();

 var filePath = 'c:/xampp/htdocs/cloud/radio/';

 if(!fs.existsSync((filePath+"recordings")))
    fs.mkdirSync((filePath+"recordings"));

var options = {
    key: fs.readFileSync('c:/dd/virtual_machine/SSL/cyberiaonline/ssl/key.key'),
    cert: fs.readFileSync('c:/dd/virtual_machine/SSL/cyberiaonline/ssl/crt.crt'),
    ca: fs.readFileSync('c:/dd/virtual_machine/SSL/cyberiaonline/ssl/ca_bundle.crt')
};

var app = connect();

app.use(serveStatic('public'));

var server = https.createServer(options,app);
server.listen(3003);

opener("https://www.cyberiaonline.com:3003");
opener("https://cyberiaonline.com:3003");

var server = binaryServer({server:server});

server.on('connection', function(client) {
    console.log("new connection...");
    var fileWriter = null;
    var writeStream = null;

    var userAgent  =client._socket.upgradeReq.headers['user-agent'];
    uaParser.setUA(userAgent);
    var ua = uaParser.getResult();

    client.on('stream', function(stream, meta) {

        console.log("Stream Start@" + meta.sampleRate +"Hz");
        var fileName = "recordings/"+ ua.os.name +"-"+ ua.os.version +"_"+ new Date().getTime();

        switch(CONFIG.AudioEncoding){
            case "WAV":
                fileWriter = new wav.FileWriter( filePath + fileName + ".wav", {
                    channels: 1,
                    sampleRate: meta.sampleRate,
                    bitDepth: 16 });
                stream.pipe(fileWriter);
            break;

            case "MP3":
                writeStream = fs.createWriteStream( filePath + fileName + ".mp3" );
                stream.pipe( new lame.Encoder(
                {
                    channels: 1, bitDepth: 16, sampleRate: meta.sampleRate, bitRate: 128, outSampleRate: 22050, mode: lame.MONO
                })
                )
                .pipe( writeStream );
            break;
        };

    });


    client.on('close', function() {
        if ( fileWriter != null ) {
            fileWriter.end();
        } else if ( writeStream != null ) {
            writeStream.end();
        }
        console.log("Connection Closed");
    });
});
