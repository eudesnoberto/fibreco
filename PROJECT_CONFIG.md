# Configuração do Projeto - R2T Fibreco

## 📋 Informações do Projeto

- **Nome**: R2T Fibreco
- **Versão**: 1.0.2
- **Desenvolvedor**: Francieudes Silva N. Alves
- **Licença**: MIT
- **Data**: Janeiro 2024

## 🛠️ Tecnologias

### Backend
- Python 3.11+
- Flask 2.3.3
- SQLAlchemy 3.0.5
- SQLite/PostgreSQL
- ReportLab 4.0.4
- Pytz 2023.3

### Frontend
- React 18
- Vite
- Tailwind CSS
- Radix UI
- Lucide React

## 🔧 Configurações

### Backend (.env)
```bash
FLASK_ENV=development
FLASK_DEBUG=True
SECRET_KEY=sua_chave_secreta
DATABASE_URL=sqlite:///r2t_fibreco.db
UPLOAD_FOLDER=uploads
MAX_CONTENT_LENGTH=16777216
```

### Frontend (.env)
```bash
VITE_API_URL=http://localhost:5002
VITE_APP_NAME=R2T Fibreco
VITE_APP_VERSION=1.0.2
```

## 📁 Estrutura

```
R2TFibreco/
├── r2t-fibreco-backend/
├── r2t-fibreco-frontend/
├── README.md
├── API_DOCUMENTATION.md
├── DEVELOPER_GUIDE.md
├── INSTALLATION_GUIDE.md
├── CHANGELOG.md
├── CONTRIBUTING.md
├── LICENSE
└── PROJECT_CONFIG.md
```

## 🚀 Comandos

### Backend
```bash
python src/main.py
```

### Frontend
```bash
npm run dev
```

## 📞 Contato

- **Email**: [email]
- **WhatsApp**: +55 81 99569-7473
