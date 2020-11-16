# NZ Downloader

## Build app (macOS)

npm run make
## Run app (macOS)

open out/nz-downloader-darwin-x64/nz-downloader.app

## Kill app (macOS)

killall nz-downloader

## Read logs for the main process

tail -f ~/Library/Application\ Support/nz-downloader/out.log

## Inspect database state

subl ~/Library/Application\ Support/nz-downloader/db.json

## Clear database state

rm ~/Library/Application\ Support/nz-downloader/db.json
