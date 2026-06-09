// carrinho-flutuante.js
const API_BASE_URL = "https://store-backend-opal.vercel.app";

class CarrinhoFlutuante {
    constructor() {
        this.aberto = false;
        this.itens = [];
        this.total = 0;
        this.quantidadeTotal = 0;
        this.init();
    }

    init() {
        this.criarHTML();
        this.carregarCarrinho();
        this.atualizarContador();
        
        // Atualizar carrinho a cada 30 segundos
        setInterval(() => this.carregarCarrinho(), 30000);
    }

    criarHTML() {
        const html = `
            <div id="carrinho-flutuante" style="position: fixed; bottom: 20px; right: 20px; z-index: 1000;">
                <!-- Botão do carrinho -->
                <button id="carrinho-toggle" class="bg-slate-900 text-white p-4 rounded-full shadow-lg hover:bg-slate-800 transition">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                    </svg>
                    <span id="carrinho-flutuante-count" class="absolute -top-1 -right-1 bg-rose-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">0</span>
                </button>

                <!-- Modal do carrinho -->
                <div id="carrinho-modal" class="hidden fixed bottom-24 right-4 w-96 bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden" style="max-height: 500px;">
                    <div class="bg-slate-900 text-white p-4 flex justify-between items-center">
                        <h3 class="font-semibold">Meu Carrinho</h3>
                        <button id="carrinho-fechar" class="text-white/70 hover:text-white">✕</button>
                    </div>
                    <div id="carrinho-conteudo" class="p-4 overflow-y-auto" style="max-height: 380px;">
                        <div class="text-center py-8 text-slate-400">Seu carrinho está vazio</div>
                    </div>
                    <div id="carrinho-footer" class="border-t border-slate-100 p-4 bg-slate-50 hidden">
                        <div class="flex justify-between font-bold mb-3">
                            <span>Total:</span>
                            <span id="carrinho-total">R$ 0,00</span>
                        </div>
                        <button id="carrinho-finalizar" class="w-full bg-emerald-600 text-white py-3 rounded-2xl font-semibold hover:bg-emerald-700 transition">
                            Finalizar Compra
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', html);
        
        // Eventos
        document.getElementById('carrinho-toggle').addEventListener('click', () => this.toggle());
        document.getElementById('carrinho-fechar').addEventListener('click', () => this.fechar());
        document.getElementById('carrinho-finalizar')?.addEventListener('click', () => this.finalizar());
    }

    async carregarCarrinho() {
        const token = localStorage.getItem('cliente_token');
        if (!token) return;

        try {
            const res = await fetch(`${API_BASE_URL}/api/clientes/carrinho`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            
            if (data.sucesso) {
                this.itens = data.itens || [];
                this.total = data.total || 0;
                this.quantidadeTotal = data.quantidadeTotal || 0;
                this.renderizar();
                this.atualizarContador();
            }
        } catch (err) {
            console.error('Erro ao carregar carrinho:', err);
        }
    }

    renderizar() {
        const conteudo = document.getElementById('carrinho-conteudo');
        const footer = document.getElementById('carrinho-footer');
        
        if (!this.itens.length) {
            conteudo.innerHTML = '<div class="text-center py-8 text-slate-400">🛒 Seu carrinho está vazio</div>';
            footer.classList.add('hidden');
            return;
        }
        
        footer.classList.remove('hidden');
        
        let html = '<div class="space-y-3">';
        this.itens.forEach(item => {
            const subtotal = item.preco_unitario * item.quantidade;
            html += `
                <div class="flex gap-3 pb-3 border-b border-slate-100">
                    <img src="${item.produtos.imagem_url || 'https://placehold.co/60'}" class="w-16 h-16 object-cover rounded-xl">
                    <div class="flex-1">
                        <h4 class="font-semibold text-sm">${item.produtos.nome}</h4>
                        <p class="text-xs text-slate-500">R$ ${item.preco_unitario.toFixed(2)}</p>
                        <div class="flex items-center gap-2 mt-2">
                            <button onclick="window.carrinhoFlutuante.alterarQuantidade('${item.id}', ${item.quantidade - 1})" 
                                    class="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200">-</button>
                            <span class="text-sm w-8 text-center">${item.quantidade}</span>
                            <button onclick="window.carrinhoFlutuante.alterarQuantidade('${item.id}', ${item.quantidade + 1})" 
                                    class="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200">+</button>
                            <button onclick="window.carrinhoFlutuante.removerItem('${item.id}')" 
                                    class="ml-2 text-rose-500 hover:text-rose-700 text-sm">🗑️</button>
                        </div>
                    </div>
                    <div class="text-right">
                        <p class="font-bold text-sm">R$ ${subtotal.toFixed(2)}</p>
                    </div>
                </div>
            `;
        });
        html += '</div>';
        
        conteudo.innerHTML = html;
        document.getElementById('carrinho-total').innerHTML = `R$ ${this.total.toFixed(2)}`;
    }

    async alterarQuantidade(itemId, novaQuantidade) {
        if (novaQuantidade < 1) {
            this.removerItem(itemId);
            return;
        }
        
        const token = localStorage.getItem('cliente_token');
        if (!token) return;
        
        try {
            const res = await fetch(`${API_BASE_URL}/api/clientes/carrinho/${itemId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ quantidade: novaQuantidade })
            });
            
            if (res.ok) {
                await this.carregarCarrinho();
            }
        } catch (err) {
            console.error('Erro ao alterar quantidade:', err);
        }
    }

    async removerItem(itemId) {
        const token = localStorage.getItem('cliente_token');
        if (!token) return;
        
        try {
            const res = await fetch(`${API_BASE_URL}/api/clientes/carrinho/${itemId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (res.ok) {
                await this.carregarCarrinho();
                this.mostrarNotificacao('Item removido do carrinho!');
            }
        } catch (err) {
            console.error('Erro ao remover item:', err);
        }
    }

    async adicionarProduto(produtoId) {
        const token = localStorage.getItem('cliente_token');
        
        if (!token) {
            if (confirm('Você precisa estar logado para comprar. Deseja fazer login agora?')) {
                window.location.href = 'login-cliente.html';
            }
            return false;
        }
        
        try {
            const res = await fetch(`${API_BASE_URL}/api/clientes/carrinho`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ produto_id: produtoId, quantidade: 1 })
            });
            
            const data = await res.json();
            
            if (res.ok) {
                await this.carregarCarrinho();
                this.mostrarNotificacao('✅ Produto adicionado ao carrinho!');
                this.abrir();
                setTimeout(() => this.fechar(), 3000);
                return true;
            } else {
                this.mostrarNotificacao(data.mensagem || 'Erro ao adicionar', 'erro');
                return false;
            }
        } catch (err) {
            console.error('Erro:', err);
            this.mostrarNotificacao('Erro de conexão', 'erro');
            return false;
        }
    }

    mostrarNotificacao(mensagem, tipo = 'sucesso') {
        const notificacao = document.createElement('div');
        notificacao.className = `fixed bottom-24 right-4 bg-${tipo === 'sucesso' ? 'green' : 'red'}-500 text-white px-4 py-2 rounded-xl shadow-lg z-50`;
        notificacao.textContent = mensagem;
        document.body.appendChild(notificacao);
        setTimeout(() => notificacao.remove(), 3000);
    }

    atualizarContador() {
        const contador = document.getElementById('carrinho-flutuante-count');
        if (contador) {
            contador.textContent = this.quantidadeTotal;
            contador.style.display = this.quantidadeTotal > 0 ? 'flex' : 'none';
        }
    }

    toggle() {
        this.aberto ? this.fechar() : this.abrir();
    }

    abrir() {
        const modal = document.getElementById('carrinho-modal');
        if (modal) {
            modal.classList.remove('hidden');
            this.aberto = true;
        }
    }

    fechar() {
        const modal = document.getElementById('carrinho-modal');
        if (modal) {
            modal.classList.add('hidden');
            this.aberto = false;
        }
    }

    finalizar() {
        window.location.href = 'carrinho.html';
    }
}

// Inicializar quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    window.carrinhoFlutuante = new CarrinhoFlutuante();
});