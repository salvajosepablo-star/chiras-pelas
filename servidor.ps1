$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add('http://localhost:8080/')
$listener.Prefixes.Add('http://127.0.0.1:8080/')
$listener.Start()
Write-Output "Servidor iniciado en http://localhost:8080/"

$baseDir = "c:\Users\Usuario\Desktop\videojuegocanicascol"

while ($listener.IsListening) {
    $context = $listener.GetContext()
    $req = $context.Request
    $res = $context.Response
    $subPath = $req.Url.LocalPath.TrimStart('/')
    if ([string]::IsNullOrWhiteSpace($subPath)) {
        $subPath = "index.html"
    }
    $filePath = [System.IO.Path]::Combine($baseDir, $subPath)
    if ([System.IO.File]::Exists($filePath)) {
        $bytes = [System.IO.File]::ReadAllBytes($filePath)
        $ext = [System.IO.Path]::GetExtension($filePath).ToLower()
        switch ($ext) {
            ".html" { $res.ContentType = "text/html; charset=utf-8" }
            ".js"   { $res.ContentType = "application/javascript; charset=utf-8" }
            ".css"  { $res.ContentType = "text/css; charset=utf-8" }
            ".json" { $res.ContentType = "application/json; charset=utf-8" }
            ".svg"  { $res.ContentType = "image/svg+xml" }
            ".png"  { $res.ContentType = "image/png" }
            ".mp3"  { $res.ContentType = "audio/mpeg" }
            ".wav"  { $res.ContentType = "audio/wav" }
            default { $res.ContentType = "application/octet-stream" }
        }
        $res.ContentLength64 = $bytes.Length
        $res.OutputStream.Write($bytes, 0, $bytes.Length)
    } else {
        $res.StatusCode = 404
    }
    $res.OutputStream.Close()
}
