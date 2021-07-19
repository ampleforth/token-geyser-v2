yarn build
aws s3 sync build/ s3://geyser.ampleforth.org/  --cache-control max-age=86400 --acl public-read
