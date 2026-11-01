curl.exe --version
curl.exe -i https://dummyjson.com/products/1
curl.exe -i -H "Content-Type: application/json" -d "@payloads/product.json" https://dummyjson.com/products/add
curl.exe -i -X PUT -H "Content-Type: application/json" -d "@payloads/update.json" https://dummyjson.com/products/1
curl.exe -i -X DELETE https://dummyjson.com/products/1
curl.exe -i "https://dummyjson.com/users?limit=2&select=firstName,email"
curl.exe -i -H "Content-Type: application/json" -d "@payloads/post.json" https://dummyjson.com/posts/add
curl.exe -I https://dummyjson.com/products
curl.exe -i https://httpbin.org/status/404
curl.exe -i https://httpbin.org/status/500
$login = curl.exe -sS -H "Content-Type: application/json" -d "@payloads/login.json" https://dummyjson.com/auth/login | ConvertFrom-Json
$token = $login.accessToken
curl.exe -i -H "Authorization: Bearer $token" https://dummyjson.com/auth/me
curl.exe -sS -o NUL -w "DNS: %{time_namelookup}s\nTCP: %{time_connect}s\nTLS: %{time_appconnect}s\nTTFB: %{time_starttransfer}s\nTotal: %{time_total}s\n" https://dummyjson.com/products
curl.exe -v https://dummyjson.com/products/1
curl.exe -I http://dummyjson.com/products/1
curl.exe -i -L -c cookies.txt "https://httpbin.org/cookies/set?user_role=student&session_key=lab1_token"
Get-Content cookies.txt
curl.exe -i -b cookies.txt https://httpbin.org/cookies
curl.exe -i -G --data-urlencode "Set-Cookie=session_id=xyz789; Path=/; Secure; HttpOnly; SameSite=Strict" https://httpbin.org/response-headers
curl.exe -i -X OPTIONS https://httpbin.org/post -H "Origin: https://my-college-app.edu" -H "Access-Control-Request-Method: POST" -H "Access-Control-Request-Headers: Content-Type, Authorization"
