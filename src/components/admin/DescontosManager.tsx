import { useState, useEffect } from 'react';
import { Loader2, Save } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Operadora, ConfiguracaoDesconto } from '@/types/energy';
import { toast } from 'sonner';

const DescontosManager = () => {
  const [operadoras, setOperadoras] = useState<Operadora[]>([]);
  const [descontos, setDescontos] = useState<Record<string, ConfiguracaoDesconto>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [operadorasRes, descontosRes] = await Promise.all([
        supabase.from('operadoras').select('*').eq('ativa', true).order('nome'),
        supabase.from('configuracoes_descontos').select('*')
      ]);

      if (operadorasRes.error) throw operadorasRes.error;
      if (descontosRes.error) throw descontosRes.error;

      setOperadoras(operadorasRes.data || []);

      const descontosMap: Record<string, ConfiguracaoDesconto> = {};
      (descontosRes.data || []).forEach((d) => {
        descontosMap[d.operadora_id] = d;
      });
      setDescontos(descontosMap);
    } catch (error) {
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (operadoraId: string) => {
    setSaving(operadoraId);

    try {
      const desconto = descontos[operadoraId];

      if (desconto?.id) {
        const { error } = await supabase
          .from('configuracoes_descontos')
          .update({
            desconto_base_potencia: desconto.desconto_base_potencia,
            desconto_base_energia: desconto.desconto_base_energia,
            desconto_dd_potencia: desconto.desconto_dd_potencia,
            desconto_dd_energia: desconto.desconto_dd_energia,
            desconto_fe_potencia: desconto.desconto_fe_potencia,
            desconto_fe_energia: desconto.desconto_fe_energia,
            desconto_dd_fe_potencia: desconto.desconto_dd_fe_potencia,
            desconto_dd_fe_energia: desconto.desconto_dd_fe_energia,
            desconto_mensal_temporario: desconto.desconto_mensal_temporario,
            duracao_meses_desconto: desconto.duracao_meses_desconto,
            descricao_desconto_temporario: desconto.descricao_desconto_temporario,
            desconto_temp_requer_dd: desconto.desconto_temp_requer_dd,
            desconto_temp_requer_fe: desconto.desconto_temp_requer_fe,
          })
          .eq('id', desconto.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('configuracoes_descontos')
          .insert([{
            operadora_id: operadoraId,
            desconto_base_potencia: desconto?.desconto_base_potencia || 0,
            desconto_base_energia: desconto?.desconto_base_energia || 0,
            desconto_dd_potencia: desconto?.desconto_dd_potencia || 0,
            desconto_dd_energia: desconto?.desconto_dd_energia || 0,
            desconto_fe_potencia: desconto?.desconto_fe_potencia || 0,
            desconto_fe_energia: desconto?.desconto_fe_energia || 0,
            desconto_dd_fe_potencia: desconto?.desconto_dd_fe_potencia || 0,
            desconto_dd_fe_energia: desconto?.desconto_dd_fe_energia || 0,
            desconto_mensal_temporario: desconto?.desconto_mensal_temporario || 0,
            duracao_meses_desconto: desconto?.duracao_meses_desconto || 0,
            descricao_desconto_temporario: desconto?.descricao_desconto_temporario || null,
            desconto_temp_requer_dd: desconto?.desconto_temp_requer_dd || false,
            desconto_temp_requer_fe: desconto?.desconto_temp_requer_fe || false,
          }]);

        if (error) throw error;
      }

      toast.success('Descontos guardados com sucesso');
      loadData();
    } catch (error) {
      toast.error('Erro ao guardar descontos');
    } finally {
      setSaving(null);
    }
  };

  const updateDesconto = (operadoraId: string, field: keyof ConfiguracaoDesconto, value: number | string | null | boolean) => {
    setDescontos((prev) => ({
      ...prev,
      [operadoraId]: {
        ...(prev[operadoraId] || {
          id: '',
          operadora_id: operadoraId,
          desconto_base_potencia: 0,
          desconto_base_energia: 0,
          desconto_dd_potencia: 0,
          desconto_dd_energia: 0,
          desconto_fe_potencia: 0,
          desconto_fe_energia: 0,
          desconto_dd_fe_potencia: 0,
          desconto_dd_fe_energia: 0,
          desconto_mensal_temporario: 0,
          duracao_meses_desconto: 0,
          descricao_desconto_temporario: null,
          desconto_temp_requer_dd: false,
          desconto_temp_requer_fe: false,
          created_at: '',
          updated_at: '',
        }),
        [field]: value,
      },
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-gold animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="font-display text-2xl text-foreground mb-2">Configuração de Descontos</h2>
        <p className="font-body text-sm text-cream-muted mb-4">
          Configure os descontos aplicáveis a cada operadora em 4 cenários diferentes.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
          <div className="text-center">
            <div className="font-body font-medium text-foreground text-sm mb-1">Desconto Base</div>
            <div className="font-body text-xs text-cream-muted">Sem DD nem FE</div>
          </div>
          <div className="text-center">
            <div className="font-body font-medium text-foreground text-sm mb-1">Desconto DD</div>
            <div className="font-body text-xs text-cream-muted">Apenas Débito Direto</div>
          </div>
          <div className="text-center">
            <div className="font-body font-medium text-foreground text-sm mb-1">Desconto FE</div>
            <div className="font-body text-xs text-cream-muted">Apenas Fatura Eletrónica</div>
          </div>
          <div className="text-center">
            <div className="font-body font-medium text-foreground text-sm mb-1">Desconto DD+FE</div>
            <div className="font-body text-xs text-cream-muted">Ambos combinados</div>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {operadoras.map((operadora) => {
          const desconto = descontos[operadora.id] || {
            desconto_base_potencia: 0,
            desconto_base_energia: 0,
            desconto_dd_potencia: 0,
            desconto_dd_energia: 0,
            desconto_fe_potencia: 0,
            desconto_fe_energia: 0,
            desconto_dd_fe_potencia: 0,
            desconto_dd_fe_energia: 0,
            desconto_mensal_temporario: 0,
            duracao_meses_desconto: 0,
            descricao_desconto_temporario: null,
            desconto_temp_requer_dd: false,
            desconto_temp_requer_fe: false,
          };

          return (
            <div key={operadora.id} className="p-6 bg-muted rounded-lg border border-border">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  {operadora.logotipo_url && (
                    <img
                      src={operadora.logotipo_url}
                      alt={operadora.nome}
                      className="w-24 h-12 object-contain bg-white rounded p-1"
                    />
                  )}
                  <h3 className="font-body font-medium text-foreground text-lg">
                    {operadora.nome}
                  </h3>
                </div>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="space-y-4">
                  <h4 className="font-body font-medium text-foreground text-sm pb-2 border-b border-border">
                    Desconto Base
                  </h4>
                  <div>
                    <label className="font-body text-xs text-cream-muted mb-2 block">
                      % Potência
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      value={desconto.desconto_base_potencia}
                      onChange={(e) => updateDesconto(operadora.id, 'desconto_base_potencia', parseFloat(e.target.value) || 0)}
                      className="w-full px-4 py-2 bg-background border border-border rounded-lg font-body text-foreground focus:outline-none focus:ring-2 focus:ring-gold/50"
                    />
                  </div>
                  <div>
                    <label className="font-body text-xs text-cream-muted mb-2 block">
                      % Energia
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      value={desconto.desconto_base_energia}
                      onChange={(e) => updateDesconto(operadora.id, 'desconto_base_energia', parseFloat(e.target.value) || 0)}
                      className="w-full px-4 py-2 bg-background border border-border rounded-lg font-body text-foreground focus:outline-none focus:ring-2 focus:ring-gold/50"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-body font-medium text-foreground text-sm pb-2 border-b border-border">
                    Apenas DD
                  </h4>
                  <div>
                    <label className="font-body text-xs text-cream-muted mb-2 block">
                      % Potência
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      value={desconto.desconto_dd_potencia}
                      onChange={(e) => updateDesconto(operadora.id, 'desconto_dd_potencia', parseFloat(e.target.value) || 0)}
                      className="w-full px-4 py-2 bg-background border border-border rounded-lg font-body text-foreground focus:outline-none focus:ring-2 focus:ring-gold/50"
                    />
                  </div>
                  <div>
                    <label className="font-body text-xs text-cream-muted mb-2 block">
                      % Energia
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      value={desconto.desconto_dd_energia}
                      onChange={(e) => updateDesconto(operadora.id, 'desconto_dd_energia', parseFloat(e.target.value) || 0)}
                      className="w-full px-4 py-2 bg-background border border-border rounded-lg font-body text-foreground focus:outline-none focus:ring-2 focus:ring-gold/50"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-body font-medium text-foreground text-sm pb-2 border-b border-border">
                    Apenas FE
                  </h4>
                  <div>
                    <label className="font-body text-xs text-cream-muted mb-2 block">
                      % Potência
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      value={desconto.desconto_fe_potencia}
                      onChange={(e) => updateDesconto(operadora.id, 'desconto_fe_potencia', parseFloat(e.target.value) || 0)}
                      className="w-full px-4 py-2 bg-background border border-border rounded-lg font-body text-foreground focus:outline-none focus:ring-2 focus:ring-gold/50"
                    />
                  </div>
                  <div>
                    <label className="font-body text-xs text-cream-muted mb-2 block">
                      % Energia
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      value={desconto.desconto_fe_energia}
                      onChange={(e) => updateDesconto(operadora.id, 'desconto_fe_energia', parseFloat(e.target.value) || 0)}
                      className="w-full px-4 py-2 bg-background border border-border rounded-lg font-body text-foreground focus:outline-none focus:ring-2 focus:ring-gold/50"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-body font-medium text-foreground text-sm pb-2 border-b border-border">
                    DD + FE
                  </h4>
                  <div>
                    <label className="font-body text-xs text-cream-muted mb-2 block">
                      % Potência
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      value={desconto.desconto_dd_fe_potencia}
                      onChange={(e) => updateDesconto(operadora.id, 'desconto_dd_fe_potencia', parseFloat(e.target.value) || 0)}
                      className="w-full px-4 py-2 bg-background border border-border rounded-lg font-body text-foreground focus:outline-none focus:ring-2 focus:ring-gold/50"
                    />
                  </div>
                  <div>
                    <label className="font-body text-xs text-cream-muted mb-2 block">
                      % Energia
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      value={desconto.desconto_dd_fe_energia}
                      onChange={(e) => updateDesconto(operadora.id, 'desconto_dd_fe_energia', parseFloat(e.target.value) || 0)}
                      className="w-full px-4 py-2 bg-background border border-border rounded-lg font-body text-foreground focus:outline-none focus:ring-2 focus:ring-gold/50"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-border">
                <h4 className="font-body font-medium text-foreground text-base mb-4">
                  Campanha Adicional (Promocional)
                </h4>
                <div className="grid md:grid-cols-3 gap-4 p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                  <div>
                    <label className="font-body text-xs text-cream-muted mb-2 block">
                      Valor do Desconto Mensal (€)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={desconto.desconto_mensal_temporario}
                      onChange={(e) => updateDesconto(operadora.id, 'desconto_mensal_temporario', parseFloat(e.target.value) || 0)}
                      className="w-full px-4 py-2 bg-background border border-border rounded-lg font-body text-foreground focus:outline-none focus:ring-2 focus:ring-gold/50"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="font-body text-xs text-cream-muted mb-2 block">
                      Duração (meses)
                    </label>
                    <input
                      type="number"
                      step="1"
                      min="0"
                      value={desconto.duracao_meses_desconto}
                      onChange={(e) => updateDesconto(operadora.id, 'duracao_meses_desconto', parseInt(e.target.value) || 0)}
                      className="w-full px-4 py-2 bg-background border border-border rounded-lg font-body text-foreground focus:outline-none focus:ring-2 focus:ring-gold/50"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="font-body text-xs text-cream-muted mb-2 block">
                      Descrição da Campanha (opcional)
                    </label>
                    <input
                      type="text"
                      value={desconto.descricao_desconto_temporario || ''}
                      onChange={(e) => updateDesconto(operadora.id, 'descricao_desconto_temporario', e.target.value || null)}
                      className="w-full px-4 py-2 bg-background border border-border rounded-lg font-body text-foreground focus:outline-none focus:ring-2 focus:ring-gold/50"
                      placeholder="Ex: Campanha de Primavera"
                    />
                  </div>
                </div>

                <div className="mt-4 p-4 bg-background rounded-lg border border-border">
                  <p className="font-body text-xs text-cream-muted mb-3">
                    Condições de Acesso à Campanha Adicional:
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={desconto.desconto_temp_requer_dd}
                        onChange={(e) => updateDesconto(operadora.id, 'desconto_temp_requer_dd', e.target.checked)}
                        className="w-4 h-4 rounded border-border text-gold focus:ring-gold focus:ring-offset-0"
                      />
                      <span className="font-body text-sm text-foreground">
                        Requer Débito Direto
                      </span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={desconto.desconto_temp_requer_fe}
                        onChange={(e) => updateDesconto(operadora.id, 'desconto_temp_requer_fe', e.target.checked)}
                        className="w-4 h-4 rounded border-border text-gold focus:ring-gold focus:ring-offset-0"
                      />
                      <span className="font-body text-sm text-foreground">
                        Requer Fatura Eletrónica
                      </span>
                    </label>
                  </div>
                  {!desconto.desconto_temp_requer_dd && !desconto.desconto_temp_requer_fe && (
                    <p className="mt-2 text-xs font-body text-green-600 dark:text-green-400">
                      Desconto disponível para todos os clientes (sem condições)
                    </p>
                  )}
                  {(desconto.desconto_temp_requer_dd || desconto.desconto_temp_requer_fe) && (
                    <p className="mt-2 text-xs font-body text-amber-600 dark:text-amber-400">
                      Desconto disponível apenas com:{' '}
                      {desconto.desconto_temp_requer_dd && desconto.desconto_temp_requer_fe && 'Débito Direto + Fatura Eletrónica'}
                      {desconto.desconto_temp_requer_dd && !desconto.desconto_temp_requer_fe && 'Débito Direto'}
                      {!desconto.desconto_temp_requer_dd && desconto.desconto_temp_requer_fe && 'Fatura Eletrónica'}
                    </p>
                  )}
                </div>

                {desconto.desconto_mensal_temporario > 0 && desconto.duracao_meses_desconto > 0 && (
                  <p className="mt-3 text-sm font-body text-amber-700 dark:text-amber-400">
                    Desconto de {desconto.desconto_mensal_temporario.toFixed(2)}€/mês durante {desconto.duracao_meses_desconto} {desconto.duracao_meses_desconto === 1 ? 'mês' : 'meses'}
                    = {(desconto.desconto_mensal_temporario * desconto.duracao_meses_desconto).toFixed(2)}€ de poupança total no período promocional
                  </p>
                )}
              </div>

              <div className="flex justify-end mt-6 pt-4 border-t border-border">
                <button
                  onClick={() => handleSave(operadora.id)}
                  disabled={saving === operadora.id}
                  className="flex items-center gap-2 px-6 py-2 bg-gold text-primary-foreground rounded-lg font-body hover:bg-gold-light transition-all disabled:opacity-50"
                >
                  {saving === operadora.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  Guardar
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DescontosManager;
