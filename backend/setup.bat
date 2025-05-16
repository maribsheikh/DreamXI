@echo off
echo Creating virtual environment...
python -m venv venv

echo Activating virtual environment...
call venv\Scripts\activate.bat

echo Installing requirements...
pip install -r requirements.txt

echo Making migrations...
python manage.py makemigrations players

echo Applying migrations...
python manage.py migrate

echo Loading sample data...
python manage.py load_player_data sample_players.csv

echo Setup complete!
pause 