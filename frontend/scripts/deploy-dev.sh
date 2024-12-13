yarn build
aws s3 sync build/ s3://dev.spot.cash/  --cache-control max-age=86400