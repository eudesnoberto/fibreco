#!/usr/bin/env python3
import os
import sys
sys.path.insert(0, os.path.dirname(__file__))

from src.main import app
from src.models.material import Material, MovimentacaoEstoque, db

def populate_database():
    with app.app_context():
        # Limpar dados existentes
        MovimentacaoEstoque.query.delete()
        Material.query.delete()
        db.session.commit()
        
        # Materiais de fibra óptica típicos
        materiais_iniciais = [
            # Plaquetas
            {
                'nome': 'Plaqueta de Emenda 12 Fibras',
                'categoria': 'plaquetas',
                'subcategoria': 'emenda',
                'quantidade': 50,
                'quantidade_minima': 10,
                'unidade': 'unidade',
                'localizacao': 'Estoque A - Prateleira 1',
                'fornecedor': 'Furukawa',
                'preco_unitario': 15.50,
                'codigo_interno': 'PL-EM-12F',
                'descricao': 'Plaqueta para emenda de até 12 fibras ópticas'
            },
            {
                'nome': 'Plaqueta de Emenda 24 Fibras',
                'categoria': 'plaquetas',
                'subcategoria': 'emenda',
                'quantidade': 30,
                'quantidade_minima': 5,
                'unidade': 'unidade',
                'localizacao': 'Estoque A - Prateleira 1',
                'fornecedor': 'Furukawa',
                'preco_unitario': 28.90,
                'codigo_interno': 'PL-EM-24F',
                'descricao': 'Plaqueta para emenda de até 24 fibras ópticas'
            },
            
            # Cabos Fig8
            {
                'nome': 'Cabo Fig8 12 Fibras SM',
                'categoria': 'cabos',
                'subcategoria': 'fig8',
                'quantidade': 2000,
                'quantidade_minima': 500,
                'unidade': 'metro',
                'localizacao': 'Estoque B - Bobinas',
                'fornecedor': 'Prysmian',
                'preco_unitario': 3.20,
                'codigo_interno': 'CB-FG8-12F-SM',
                'descricao': 'Cabo óptico autossustentado figura 8, 12 fibras monomodo'
            },
            {
                'nome': 'Cabo Fig8 24 Fibras SM',
                'categoria': 'cabos',
                'subcategoria': 'fig8',
                'quantidade': 1500,
                'quantidade_minima': 300,
                'unidade': 'metro',
                'localizacao': 'Estoque B - Bobinas',
                'fornecedor': 'Prysmian',
                'preco_unitario': 5.80,
                'codigo_interno': 'CB-FG8-24F-SM',
                'descricao': 'Cabo óptico autossustentado figura 8, 24 fibras monomodo'
            },
            
            # Caixas CTO
            {
                'nome': 'Caixa CTO 8 Portas',
                'categoria': 'caixas',
                'subcategoria': 'cto',
                'quantidade': 25,
                'quantidade_minima': 5,
                'unidade': 'unidade',
                'localizacao': 'Estoque C - Prateleira 2',
                'fornecedor': 'Intelbras',
                'preco_unitario': 85.00,
                'codigo_interno': 'CX-CTO-8P',
                'descricao': 'Caixa de terminação óptica para 8 portas SC/APC'
            },
            {
                'nome': 'Caixa CTO 16 Portas',
                'categoria': 'caixas',
                'subcategoria': 'cto',
                'quantidade': 15,
                'quantidade_minima': 3,
                'unidade': 'unidade',
                'localizacao': 'Estoque C - Prateleira 2',
                'fornecedor': 'Intelbras',
                'preco_unitario': 120.00,
                'codigo_interno': 'CX-CTO-16P',
                'descricao': 'Caixa de terminação óptica para 16 portas SC/APC'
            },
            
            # Caixas GP
            {
                'nome': 'Caixa GP 12 Fibras',
                'categoria': 'caixas',
                'subcategoria': 'gp',
                'quantidade': 20,
                'quantidade_minima': 5,
                'unidade': 'unidade',
                'localizacao': 'Estoque C - Prateleira 3',
                'fornecedor': 'Furukawa',
                'preco_unitario': 180.00,
                'codigo_interno': 'CX-GP-12F',
                'descricao': 'Caixa de emenda óptica para 12 fibras, uso externo'
            },
            
            # Conectores SC APC
            {
                'nome': 'Conector SC/APC Monomodo',
                'categoria': 'conectores',
                'subcategoria': 'sc_apc',
                'quantidade': 200,
                'quantidade_minima': 50,
                'unidade': 'unidade',
                'localizacao': 'Estoque D - Gaveta 1',
                'fornecedor': 'Furukawa',
                'preco_unitario': 8.50,
                'codigo_interno': 'CN-SC-APC-SM',
                'descricao': 'Conector SC/APC para fibra monomodo'
            },
            
            # Conectores Precom
            {
                'nome': 'Conector Precom SC/APC',
                'categoria': 'conectores',
                'subcategoria': 'precom',
                'quantidade': 150,
                'quantidade_minima': 30,
                'unidade': 'unidade',
                'localizacao': 'Estoque D - Gaveta 2',
                'fornecedor': 'Precom',
                'preco_unitario': 12.00,
                'codigo_interno': 'CN-PRECOM-SC-APC',
                'descricao': 'Conector Precom SC/APC pré-conectorizado'
            },
            
            # Tubetes
            {
                'nome': 'Tubete 40mm Preto',
                'categoria': 'tubetes',
                'subcategoria': 'proteção',
                'quantidade': 500,
                'quantidade_minima': 100,
                'unidade': 'unidade',
                'localizacao': 'Estoque E - Caixa 1',
                'fornecedor': 'Hellermann',
                'preco_unitario': 2.50,
                'codigo_interno': 'TB-40MM-PT',
                'descricao': 'Tubete termocontrátil 40mm preto para proteção de emendas'
            },
            {
                'nome': 'Tubete 60mm Preto',
                'categoria': 'tubetes',
                'subcategoria': 'proteção',
                'quantidade': 300,
                'quantidade_minima': 50,
                'unidade': 'unidade',
                'localizacao': 'Estoque E - Caixa 1',
                'fornecedor': 'Hellermann',
                'preco_unitario': 3.80,
                'codigo_interno': 'TB-60MM-PT',
                'descricao': 'Tubete termocontrátil 60mm preto para proteção de emendas'
            },
            
            # Outros materiais
            {
                'nome': 'Cordão Óptico SC/APC-SC/APC 3m',
                'categoria': 'cordões',
                'subcategoria': 'patch_cord',
                'quantidade': 100,
                'quantidade_minima': 20,
                'unidade': 'unidade',
                'localizacao': 'Estoque F - Prateleira 1',
                'fornecedor': 'Furukawa',
                'preco_unitario': 25.00,
                'codigo_interno': 'PC-SC-APC-3M',
                'descricao': 'Patch cord SC/APC para SC/APC, 3 metros, monomodo'
            },
            {
                'nome': 'Splitter 1x8 SC/APC',
                'categoria': 'splitters',
                'subcategoria': '1x8',
                'quantidade': 40,
                'quantidade_minima': 10,
                'unidade': 'unidade',
                'localizacao': 'Estoque G - Prateleira 1',
                'fornecedor': 'Intelbras',
                'preco_unitario': 45.00,
                'codigo_interno': 'SP-1X8-SC-APC',
                'descricao': 'Splitter óptico 1x8 com conectores SC/APC'
            },
            {
                'nome': 'Abraçadeira Plástica 200mm',
                'categoria': 'acessórios',
                'subcategoria': 'fixação',
                'quantidade': 1000,
                'quantidade_minima': 200,
                'unidade': 'unidade',
                'localizacao': 'Estoque H - Caixa 1',
                'fornecedor': 'Hellermann',
                'preco_unitario': 0.50,
                'codigo_interno': 'AB-PL-200MM',
                'descricao': 'Abraçadeira plástica 200mm para fixação de cabos'
            }
        ]
        
        # Inserir materiais
        for material_data in materiais_iniciais:
            material = Material(**material_data)
            db.session.add(material)
            db.session.flush()  # Para obter o ID
            
            # Criar movimentação inicial
            if material.quantidade > 0:
                movimentacao = MovimentacaoEstoque(
                    material_id=material.id,
                    tipo_movimentacao='entrada',
                    quantidade=material.quantidade,
                    quantidade_anterior=0,
                    quantidade_atual=material.quantidade,
                    motivo='Estoque inicial',
                    responsavel='Sistema'
                )
                db.session.add(movimentacao)
        
        db.session.commit()
        print(f"Banco de dados populado com {len(materiais_iniciais)} materiais!")

if __name__ == '__main__':
    populate_database()

