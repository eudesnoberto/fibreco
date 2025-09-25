from datetime import datetime
import pytz

def get_recife_time():
    """
    Retorna o horário atual de Recife (UTC-3)
    """
    recife_tz = pytz.timezone('America/Recife')
    return datetime.now(recife_tz)

def get_recife_time_utc():
    """
    Retorna o horário atual de Recife convertido para UTC
    para armazenamento no banco de dados
    """
    recife_tz = pytz.timezone('America/Recife')
    recife_time = datetime.now(recife_tz)
    return recife_time.astimezone(pytz.UTC)
