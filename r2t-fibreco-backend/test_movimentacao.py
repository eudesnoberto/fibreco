#!/usr/bin/env python3
"""
Script para testar a criação de movimentação com responsável e imagens
"""

import requests
import json

def test_movimentacao():
    base_url = "http://localhost:5002/api"
    
    # 1. Fazer login
    print("1. Fazendo login...")
    login_data = {
        "username": "admin",
        "password": "admin123"
    }
    
    response = requests.post(f"{base_url}/login", json=login_data)
    if response.status_code != 200:
        print(f"Erro no login: {response.status_code} - {response.text}")
        return
    
    token = response.json()["token"]
    print(f"Login realizado com sucesso! Token: {token[:20]}...")
    
    # 2. Buscar usuários
    print("\n2. Buscando usuários...")
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(f"{base_url}/usuarios", headers=headers)
    if response.status_code != 200:
        print(f"Erro ao buscar usuários: {response.status_code} - {response.text}")
        return
    
    usuarios = response.json()
    print(f"Usuários encontrados: {len(usuarios)}")
    for usuario in usuarios:
        print(f"  - {usuario['nome']} ({usuario['role']})")
    
    # 3. Buscar materiais
    print("\n3. Buscando materiais...")
    response = requests.get(f"{base_url}/materiais", headers=headers)
    if response.status_code != 200:
        print(f"Erro ao buscar materiais: {response.status_code} - {response.text}")
        return
    
    materiais = response.json()
    print(f"Materiais encontrados: {len(materiais)}")
    if materiais:
        material = materiais[0]
        print(f"  - Usando material: {material['nome']} (ID: {material['id']})")
        
        # 4. Criar movimentação
        print("\n4. Criando movimentação...")
        movimentacao_data = {
            "tipo_movimentacao": "saida",
            "quantidade": 5,
            "motivo": "Teste de movimentação com responsável",
            "responsavel": usuarios[0]["nome"] if usuarios else "Teste",
            "responsavel_id": usuarios[0]["id"] if usuarios else None,
            "imagens": []
        }
        
        response = requests.post(
            f"{base_url}/materiais/{material['id']}/movimentacao",
            json=movimentacao_data,
            headers=headers
        )
        
        if response.status_code == 201:
            movimentacao = response.json()
            print("Movimentação criada com sucesso!")
            print(f"  - ID: {movimentacao['id']}")
            print(f"  - Tipo: {movimentacao['tipo_movimentacao']}")
            print(f"  - Quantidade: {movimentacao['quantidade']}")
            print(f"  - Responsável: {movimentacao.get('responsavel_nome', 'N/A')}")
            print(f"  - Imagens: {len(movimentacao.get('imagens', []))}")
        else:
            print(f"Erro ao criar movimentação: {response.status_code} - {response.text}")
    else:
        print("Nenhum material encontrado para testar")

if __name__ == "__main__":
    test_movimentacao()
