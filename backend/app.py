from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
import sqlite3
from datetime import datetime
import os
import re
import smtplib 
from email.mime.text import MIMEText


app = Flask(__name__)
DOZVOLJENI_DOMENI = os.environ.get("ALLOWED_ORIGIN", "*")
CORS(app, origins=[DOZVOLJENI_DOMENI])

limiter = Limiter(
    get_remote_address,
    app=app,
    default_limits=[]
)

EMAIL_REGEX = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
API_KEY =API_KEY = os.environ.get("API_KEY", "Bole1234!!2") 
GMAIL_ADRESA = "sarcevicbogdan258@gmail.com"
GMAIL_APP_LOZINKA = os.environ.get("GMAIL_APP_LOZINKA", "zsyilnxzkweftvqv")



def init_db():
    conn = sqlite3.connect('poruke.db')
    c = conn.cursor()
    c.execute('''CREATE TABLE IF NOT EXISTS poruke (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ime TEXT NOT NULL,
        email TEXT NOT NULL,
        poruka TEXT NOT NULL,
        datum TEXT NOT NULL
    )''')
    conn.commit()
    conn.close()


def posalji_obavestenje(ime, email, poruka):
    try:
        ime_cisto= ime.replace('\n', ' ').replace('\r', ' ')
        tekst = f"Ime: {ime}\nEmail: {email}\n\nPoruka:\n{poruka}"
        msg = MIMEText(tekst)
        msg['Subject'] = f"Nova poruka sa sajta od {ime}"
        msg['From'] = GMAIL_ADRESA
        msg['To'] = GMAIL_ADRESA

        with smtplib.SMTP_SSL('smtp.gmail.com', 465) as server:
            server.login(GMAIL_ADRESA, GMAIL_APP_LOZINKA)
            server.send_message(msg)
    except Exception as e:
        print(f"Greška pri slanju mejla: {e}")


   


@app.route('/api/kontakt', methods=['POST'])
@limiter.limit("5 per minute")
def primi_poruku():
    data = request.get_json(silent=True) or {}
    ime = data.get('ime')
    email = data.get('email')
    poruka = data.get('poruka')
    website = data.get('website', '')

    if website:
       return jsonify({'status': 'uspesno poslato'}), 200

    if not ime or not email or not poruka:
        return jsonify({'greska': 'Sva polja su obavezna'}), 400

    if not EMAIL_REGEX.match(email):
        return jsonify({'greska': 'Email nije validan'}), 400

    conn = sqlite3.connect('poruke.db')
    c = conn.cursor()
    c.execute('INSERT INTO poruke (ime, email, poruka, datum) VALUES (?, ?, ?, ?)',
              (ime, email, poruka, datetime.now().isoformat()))
    conn.commit()
    conn.close()

    posalji_obavestenje(ime, email, poruka)

    return jsonify({'status': 'uspesno poslato'}), 200
@app.route('/api/poruke', methods=['GET'])
def prikazi_poruke():
    if request.headers.get('X-API-Key') != API_KEY:
        return jsonify({'greska': 'Nemate pristup'}), 401
    
    conn = sqlite3.connect('poruke.db')
    c = conn.cursor()
    c.execute('SELECT id, ime, email, poruka, datum FROM poruke ORDER BY id DESC')
    redovi = c.fetchall()
    conn.close()

    poruke = []
    for r in redovi:
        poruke.append({'id': r[0], 'ime': r[1], 'email': r[2], 'poruka': r[3], 'datum': r[4]})

    return jsonify(poruke)

init_db()

if __name__ == '__main__':
    debug_mode = os.environ.get("FLASK_DEBUG", "1") == "1"
    app.run(debug=debug_mode, port=5000)