from flask import Flask

app = Flask(__name__)

@app.route('/')
def main():
    return "<h1> Welcome to our app </h1?"

if __name__ == "__main__":
    app.run(debug=True, port=5006)