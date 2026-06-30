import http.server
import socketserver
import webbrowser

PORT = 8000
Handler = http.server.SimpleHTTPRequestHandler

# Automatically opens your default browser to the server address
webbrowser.open(f"http://localhost:{PORT}")

print(f"Serving local files at http://localhost:{PORT}")
with socketserver.TCPServer(("", PORT), Handler) as httpd:
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down server.")
        httpd.server_close()
