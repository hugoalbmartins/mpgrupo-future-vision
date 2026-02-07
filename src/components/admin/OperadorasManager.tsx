import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Image as ImageIcon, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Operadora, POTENCIAS_DISPONIVEIS, CicloHorario, TarifasOperadora } from '@/types/energy';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';

const OperadorasManager = () => {
  const [operadoras, setOperadoras] = useState<Operadora[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>('');

  const [formData, setFormData] = useState({
    nome: '',
    logotipo_url: '',
    ativa: true,
  });

  const [tiposEnergia, setTiposEnergia] = useState<('eletricidade' | 'gas')[]>([]);
  const [ciclosDisponiveis, setCiclosDisponiveis] = useState<CicloHorario[]>([]);
  const [tarifas, setTarifas] = useState<TarifasOperadora>({});
  const [activeTab, setActiveTab] = useState<CicloHorario | 'gas'>('simples');

  useEffect(() => {
    loadOperadoras();
  }, []);

  const loadOperadoras = async () => {
    try {
      const { data, error } = await supabase
        .from('operadoras')
        .select('*')
        .order('nome');

      if (error) throw error;
      setOperadoras(data || []);
    } catch (error) {
      toast.error('Erro ao carregar operadoras');
    } finally {
      setLoading(false);
    }
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadLogo = async (file: File): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${crypto.randomUUID()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('operadoras-logos')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('operadoras-logos')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading logo:', error);
      return null;
    }
  };

  const deleteOldLogo = async (logoUrl: string) => {
    try {
      const fileName = logoUrl.split('/').pop();
      if (fileName) {
        await supabase.storage
          .from('operadoras-logos')
          .remove([fileName]);
      }
    } catch (error) {
      console.error('Error deleting old logo:', error);
    }
  };

  const openDialog = (operadora?: Operadora) => {
    setLogoFile(null);
    setLogoPreview('');

    if (operadora) {
      setEditingId(operadora.id);
      setFormData({
        nome: operadora.nome,
        logotipo_url: operadora.logotipo_url || '',
        ativa: operadora.ativa,
      });
      setTiposEnergia(operadora.tipos_energia || []);
      setCiclosDisponiveis(operadora.ciclos_disponiveis || []);
      setTarifas(operadora.tarifas || {});

      if (operadora.tipos_energia?.includes('gas') && !operadora.tipos_energia?.includes('eletricidade')) {
        setActiveTab('gas');
      } else {
        setActiveTab(operadora.ciclos_disponiveis?.[0] || 'simples');
      }

      if (operadora.logotipo_url) {
        setLogoPreview(operadora.logotipo_url);
      }
    } else {
      setEditingId(null);
      setFormData({
        nome: '',
        logotipo_url: '',
        ativa: true,
      });
      setTiposEnergia([]);
      setCiclosDisponiveis([]);
      setTarifas({});
      setActiveTab('simples');
    }
    setShowDialog(true);
  };

  const handleTipoEnergiaToggle = (tipo: 'eletricidade' | 'gas') => {
    if (tiposEnergia.includes(tipo)) {
      setTiposEnergia(tiposEnergia.filter(t => t !== tipo));
      if (tipo === 'eletricidade') {
        setCiclosDisponiveis([]);
        const newTarifas = { ...tarifas };
        delete newTarifas.simples;
        delete newTarifas['bi-horario'];
        delete newTarifas['tri-horario'];
        setTarifas(newTarifas);
      } else {
        const newTarifas = { ...tarifas };
        delete newTarifas.gas;
        setTarifas(newTarifas);
      }
    } else {
      setTiposEnergia([...tiposEnergia, tipo]);
      if (tipo === 'gas' && !tarifas.gas) {
        setTarifas({
          ...tarifas,
          gas: {
            escaloes: {
              '1': { valor_diario: '' as any, valor_kwh: '' as any },
              '2': { valor_diario: '' as any, valor_kwh: '' as any },
              '3': { valor_diario: '' as any, valor_kwh: '' as any },
              '4': { valor_diario: '' as any, valor_kwh: '' as any }
            }
          }
        });
        if (tiposEnergia.length === 0) {
          setActiveTab('gas');
        }
      }
    }
  };

  const handleCicloToggle = (ciclo: CicloHorario) => {
    if (ciclosDisponiveis.includes(ciclo)) {
      setCiclosDisponiveis(ciclosDisponiveis.filter(c => c !== ciclo));
      const newTarifas = { ...tarifas };
      delete newTarifas[ciclo];
      setTarifas(newTarifas);
    } else {
      setCiclosDisponiveis([...ciclosDisponiveis, ciclo]);
      if (ciclo === 'simples') {
        setTarifas({
          ...tarifas,
          simples: { valor_kwh: 0, valor_diario_potencias: {} }
        });
      } else if (ciclo === 'bi-horario') {
        setTarifas({
          ...tarifas,
          'bi-horario': { valor_kwh_vazio: 0, valor_kwh_fora_vazio: 0, valor_diario_potencias: {} }
        });
      } else {
        setTarifas({
          ...tarifas,
          'tri-horario': { valor_kwh_vazio: 0, valor_kwh_cheias: 0, valor_kwh_ponta: 0, valor_diario_potencias: {} }
        });
      }
      if (ciclosDisponiveis.length === 0) {
        setActiveTab(ciclo);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (tiposEnergia.length === 0) {
      toast.error('Selecione pelo menos um tipo de energia');
      return;
    }

    if (tiposEnergia.includes('eletricidade') && ciclosDisponiveis.length === 0) {
      toast.error('Selecione pelo menos um ciclo horário para eletricidade');
      return;
    }

    setSubmitting(true);

    try {
      let logoUrl = formData.logotipo_url;

      if (logoFile) {
        const uploadedUrl = await uploadLogo(logoFile);
        if (!uploadedUrl) {
          toast.error('Erro ao fazer upload do logótipo');
          setSubmitting(false);
          return;
        }

        if (editingId && formData.logotipo_url) {
          await deleteOldLogo(formData.logotipo_url);
        }

        logoUrl = uploadedUrl;
      }

      const dataToSubmit = {
        ...formData,
        logotipo_url: logoUrl,
        tipos_energia: tiposEnergia,
        ciclos_disponiveis: ciclosDisponiveis,
        tarifas: tarifas,
      };

      if (editingId) {
        const { error } = await supabase
          .from('operadoras')
          .update(dataToSubmit)
          .eq('id', editingId);

        if (error) throw error;
        toast.success('Operadora atualizada com sucesso');
      } else {
        const { error } = await supabase
          .from('operadoras')
          .insert([dataToSubmit]);

        if (error) throw error;
        toast.success('Operadora criada com sucesso');
      }

      setShowDialog(false);
      loadOperadoras();
    } catch (error) {
      toast.error('Erro ao guardar operadora');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem a certeza que deseja eliminar esta operadora?')) return;

    try {
      const { error } = await supabase
        .from('operadoras')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Operadora eliminada');
      loadOperadoras();
    } catch (error) {
      toast.error('Erro ao eliminar operadora');
    }
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
      <div className="flex justify-between items-center mb-6">
        <h2 className="font-display text-2xl text-foreground">Gestão de Operadoras</h2>
        <button
          onClick={() => openDialog()}
          className="flex items-center gap-2 px-4 py-2 bg-gold text-primary-foreground rounded-lg font-body hover:bg-gold-light transition-all"
        >
          <Plus className="w-5 h-5" />
          Nova Operadora
        </button>
      </div>

      <div className="grid gap-4">
        {operadoras.map((operadora) => (
          <div key={operadora.id} className="p-4 bg-muted rounded-lg border border-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {operadora.logotipo_url ? (
                  <img
                    src={operadora.logotipo_url}
                    alt={operadora.nome}
                    className="w-24 h-12 object-contain bg-white rounded p-1"
                  />
                ) : (
                  <div className="w-24 h-12 bg-muted-foreground/10 rounded flex items-center justify-center">
                    <ImageIcon className="w-6 h-6 text-muted-foreground" />
                  </div>
                )}
                <div>
                  <h3 className="font-body font-medium text-foreground">{operadora.nome}</h3>
                  <p className="text-sm text-cream-muted">
                    {operadora.ativa ? 'Ativa' : 'Inativa'} • {operadora.tipos_energia?.map(t => t === 'eletricidade' ? 'Eletricidade' : 'Gás').join(' + ') || 'Sem energias'}
                  </p>
                  {operadora.tipos_energia?.includes('eletricidade') && (
                    <p className="text-xs text-cream-muted">
                      Ciclos: {operadora.ciclos_disponiveis?.join(', ') || 'Nenhum'}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => openDialog(operadora)}
                  className="p-2 text-gold hover:bg-gold/10 rounded-lg transition-all"
                >
                  <Edit className="w-5 h-5" />
                </button>
                <button
                  onClick={() => handleDelete(operadora.id)}
                  className="p-2 text-destructive hover:bg-destructive/10 rounded-lg transition-all"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl">
              {editingId ? 'Editar Operadora' : 'Nova Operadora'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="font-body text-sm text-cream-muted mb-2 block">
                  Nome *
                </label>
                <input
                  type="text"
                  required
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  className="w-full px-4 py-2 bg-muted border border-border rounded-lg font-body text-foreground focus:outline-none focus:ring-2 focus:ring-gold/50"
                />
              </div>

              <div>
                <label className="font-body text-sm text-cream-muted mb-2 block">
                  Logótipo
                </label>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/svg+xml,image/webp"
                  onChange={handleLogoChange}
                  className="w-full px-4 py-2 bg-muted border border-border rounded-lg font-body text-foreground focus:outline-none focus:ring-2 focus:ring-gold/50"
                />
                {logoPreview && (
                  <div className="mt-2">
                    <img
                      src={logoPreview}
                      alt="Preview"
                      className="h-16 object-contain bg-white rounded p-2 border border-border"
                    />
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="font-body text-sm text-cream-muted mb-3 block">
                Tipos de Energia *
              </label>
              <div className="flex gap-6">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="tipo-eletricidade"
                    checked={tiposEnergia.includes('eletricidade')}
                    onCheckedChange={() => handleTipoEnergiaToggle('eletricidade')}
                  />
                  <label htmlFor="tipo-eletricidade" className="font-body text-sm cursor-pointer">
                    Eletricidade
                  </label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="tipo-gas"
                    checked={tiposEnergia.includes('gas')}
                    onCheckedChange={() => handleTipoEnergiaToggle('gas')}
                  />
                  <label htmlFor="tipo-gas" className="font-body text-sm cursor-pointer">
                    Gás Natural
                  </label>
                </div>
              </div>
            </div>

            {tiposEnergia.includes('eletricidade') && (
              <div>
                <label className="font-body text-sm text-cream-muted mb-3 block">
                  Ciclos Horários Disponíveis *
                </label>
                <div className="flex gap-6">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="ciclo-simples"
                      checked={ciclosDisponiveis.includes('simples')}
                      onCheckedChange={() => handleCicloToggle('simples')}
                    />
                    <label htmlFor="ciclo-simples" className="font-body text-sm cursor-pointer">
                      Simples
                    </label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="ciclo-bi"
                      checked={ciclosDisponiveis.includes('bi-horario')}
                      onCheckedChange={() => handleCicloToggle('bi-horario')}
                    />
                    <label htmlFor="ciclo-bi" className="font-body text-sm cursor-pointer">
                      Bi-horário
                    </label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="ciclo-tri"
                      checked={ciclosDisponiveis.includes('tri-horario')}
                      onCheckedChange={() => handleCicloToggle('tri-horario')}
                    />
                    <label htmlFor="ciclo-tri" className="font-body text-sm cursor-pointer">
                      Tri-horário
                    </label>
                  </div>
                </div>
              </div>
            )}

            {(ciclosDisponiveis.length > 0 || tiposEnergia.includes('gas')) && (
              <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as CicloHorario | 'gas')}>
                <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${ciclosDisponiveis.length + (tiposEnergia.includes('gas') ? 1 : 0)}, 1fr)` }}>
                  {ciclosDisponiveis.includes('simples') && (
                    <TabsTrigger value="simples">Simples</TabsTrigger>
                  )}
                  {ciclosDisponiveis.includes('bi-horario') && (
                    <TabsTrigger value="bi-horario">Bi-horário</TabsTrigger>
                  )}
                  {ciclosDisponiveis.includes('tri-horario') && (
                    <TabsTrigger value="tri-horario">Tri-horário</TabsTrigger>
                  )}
                  {tiposEnergia.includes('gas') && (
                    <TabsTrigger value="gas">Gás Natural</TabsTrigger>
                  )}
                </TabsList>

                {ciclosDisponiveis.includes('simples') && (
                  <TabsContent value="simples" className="space-y-4">
                    <div>
                      <label className="font-body text-sm text-cream-muted mb-2 block">
                        Valor kWh (€/kWh)
                      </label>
                      <input
                        type="number"
                        step="0.000001"
                        value={tarifas.simples?.valor_kwh || 0}
                        onChange={(e) => setTarifas({
                          ...tarifas,
                          simples: {
                            ...tarifas.simples!,
                            valor_kwh: parseFloat(e.target.value) || 0
                          }
                        })}
                        className="w-full px-4 py-2 bg-muted border border-border rounded-lg font-body text-foreground focus:outline-none focus:ring-2 focus:ring-gold/50"
                      />
                    </div>

                    <div>
                      <h4 className="font-body font-medium text-foreground mb-3">
                        Valor Diário por Potência (€/dia)
                      </h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-h-64 overflow-y-auto p-2 bg-muted/50 rounded-lg">
                        {POTENCIAS_DISPONIVEIS.map((potencia) => (
                          <div key={potencia}>
                            <label className="font-body text-xs text-cream-muted mb-1 block">
                              {potencia} kVA
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              value={tarifas.simples?.valor_diario_potencias?.[potencia.toString()] || ''}
                              onChange={(e) => setTarifas({
                                ...tarifas,
                                simples: {
                                  ...tarifas.simples!,
                                  valor_diario_potencias: {
                                    ...tarifas.simples!.valor_diario_potencias,
                                    [potencia.toString()]: parseFloat(e.target.value) || 0
                                  }
                                }
                              })}
                              className="w-full px-3 py-1.5 text-sm bg-background border border-border rounded font-body text-foreground focus:outline-none focus:ring-1 focus:ring-gold/50"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </TabsContent>
                )}

                {ciclosDisponiveis.includes('bi-horario') && (
                  <TabsContent value="bi-horario" className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="font-body text-sm text-cream-muted mb-2 block">
                          Valor kWh Vazio (€/kWh)
                        </label>
                        <input
                          type="number"
                          step="0.000001"
                          value={tarifas['bi-horario']?.valor_kwh_vazio || 0}
                          onChange={(e) => setTarifas({
                            ...tarifas,
                            'bi-horario': {
                              ...tarifas['bi-horario']!,
                              valor_kwh_vazio: parseFloat(e.target.value) || 0
                            }
                          })}
                          className="w-full px-4 py-2 bg-muted border border-border rounded-lg font-body text-foreground focus:outline-none focus:ring-2 focus:ring-gold/50"
                        />
                      </div>
                      <div>
                        <label className="font-body text-sm text-cream-muted mb-2 block">
                          Valor kWh Fora de Vazio (€/kWh)
                        </label>
                        <input
                          type="number"
                          step="0.000001"
                          value={tarifas['bi-horario']?.valor_kwh_fora_vazio || 0}
                          onChange={(e) => setTarifas({
                            ...tarifas,
                            'bi-horario': {
                              ...tarifas['bi-horario']!,
                              valor_kwh_fora_vazio: parseFloat(e.target.value) || 0
                            }
                          })}
                          className="w-full px-4 py-2 bg-muted border border-border rounded-lg font-body text-foreground focus:outline-none focus:ring-2 focus:ring-gold/50"
                        />
                      </div>
                    </div>

                    <div>
                      <h4 className="font-body font-medium text-foreground mb-3">
                        Valor Diário por Potência (€/dia)
                      </h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-h-64 overflow-y-auto p-2 bg-muted/50 rounded-lg">
                        {POTENCIAS_DISPONIVEIS.map((potencia) => (
                          <div key={potencia}>
                            <label className="font-body text-xs text-cream-muted mb-1 block">
                              {potencia} kVA
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              value={tarifas['bi-horario']?.valor_diario_potencias?.[potencia.toString()] || ''}
                              onChange={(e) => setTarifas({
                                ...tarifas,
                                'bi-horario': {
                                  ...tarifas['bi-horario']!,
                                  valor_diario_potencias: {
                                    ...tarifas['bi-horario']!.valor_diario_potencias,
                                    [potencia.toString()]: parseFloat(e.target.value) || 0
                                  }
                                }
                              })}
                              className="w-full px-3 py-1.5 text-sm bg-background border border-border rounded font-body text-foreground focus:outline-none focus:ring-1 focus:ring-gold/50"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </TabsContent>
                )}

                {ciclosDisponiveis.includes('tri-horario') && (
                  <TabsContent value="tri-horario" className="space-y-4">
                    <div className="grid md:grid-cols-3 gap-4">
                      <div>
                        <label className="font-body text-sm text-cream-muted mb-2 block">
                          Valor kWh Vazio (€/kWh)
                        </label>
                        <input
                          type="number"
                          step="0.000001"
                          value={tarifas['tri-horario']?.valor_kwh_vazio || 0}
                          onChange={(e) => setTarifas({
                            ...tarifas,
                            'tri-horario': {
                              ...tarifas['tri-horario']!,
                              valor_kwh_vazio: parseFloat(e.target.value) || 0
                            }
                          })}
                          className="w-full px-4 py-2 bg-muted border border-border rounded-lg font-body text-foreground focus:outline-none focus:ring-2 focus:ring-gold/50"
                        />
                      </div>
                      <div>
                        <label className="font-body text-sm text-cream-muted mb-2 block">
                          Valor kWh Cheias (€/kWh)
                        </label>
                        <input
                          type="number"
                          step="0.000001"
                          value={tarifas['tri-horario']?.valor_kwh_cheias || 0}
                          onChange={(e) => setTarifas({
                            ...tarifas,
                            'tri-horario': {
                              ...tarifas['tri-horario']!,
                              valor_kwh_cheias: parseFloat(e.target.value) || 0
                            }
                          })}
                          className="w-full px-4 py-2 bg-muted border border-border rounded-lg font-body text-foreground focus:outline-none focus:ring-2 focus:ring-gold/50"
                        />
                      </div>
                      <div>
                        <label className="font-body text-sm text-cream-muted mb-2 block">
                          Valor kWh Ponta (€/kWh)
                        </label>
                        <input
                          type="number"
                          step="0.000001"
                          value={tarifas['tri-horario']?.valor_kwh_ponta || 0}
                          onChange={(e) => setTarifas({
                            ...tarifas,
                            'tri-horario': {
                              ...tarifas['tri-horario']!,
                              valor_kwh_ponta: parseFloat(e.target.value) || 0
                            }
                          })}
                          className="w-full px-4 py-2 bg-muted border border-border rounded-lg font-body text-foreground focus:outline-none focus:ring-2 focus:ring-gold/50"
                        />
                      </div>
                    </div>

                    <div>
                      <h4 className="font-body font-medium text-foreground mb-3">
                        Valor Diário por Potência (€/dia)
                      </h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-h-64 overflow-y-auto p-2 bg-muted/50 rounded-lg">
                        {POTENCIAS_DISPONIVEIS.map((potencia) => (
                          <div key={potencia}>
                            <label className="font-body text-xs text-cream-muted mb-1 block">
                              {potencia} kVA
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              value={tarifas['tri-horario']?.valor_diario_potencias?.[potencia.toString()] || ''}
                              onChange={(e) => setTarifas({
                                ...tarifas,
                                'tri-horario': {
                                  ...tarifas['tri-horario']!,
                                  valor_diario_potencias: {
                                    ...tarifas['tri-horario']!.valor_diario_potencias,
                                    [potencia.toString()]: parseFloat(e.target.value) || 0
                                  }
                                }
                              })}
                              className="w-full px-3 py-1.5 text-sm bg-background border border-border rounded font-body text-foreground focus:outline-none focus:ring-1 focus:ring-gold/50"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </TabsContent>
                )}

                {tiposEnergia.includes('gas') && (
                  <TabsContent value="gas" className="space-y-4">
                    <div>
                      <h4 className="font-body font-medium text-foreground mb-3">
                        Configuração de Tarifas de Gás por Escalão
                      </h4>
                      <div className="grid gap-4">
                        {['1', '2', '3', '4'].map((escalao) => (
                          <div key={escalao} className="p-4 bg-muted/50 rounded-lg border border-border">
                            <h5 className="font-body font-medium text-foreground mb-3">
                              Escalão {escalao}
                            </h5>
                            <div className="grid md:grid-cols-2 gap-4">
                              <div>
                                <label className="font-body text-sm text-cream-muted mb-2 block">
                                  Valor Diário (€/dia)
                                </label>
                                <input
                                  type="number"
                                  step="0.000001"
                                  value={tarifas.gas?.escaloes?.[escalao]?.valor_diario ?? ''}
                                  onChange={(e) => setTarifas({
                                    ...tarifas,
                                    gas: {
                                      ...tarifas.gas!,
                                      escaloes: {
                                        ...tarifas.gas!.escaloes,
                                        [escalao]: {
                                          ...tarifas.gas!.escaloes[escalao],
                                          valor_diario: e.target.value === '' ? '' as any : parseFloat(e.target.value)
                                        }
                                      }
                                    }
                                  })}
                                  className="w-full px-4 py-2 bg-background border border-border rounded-lg font-body text-foreground focus:outline-none focus:ring-2 focus:ring-gold/50"
                                  placeholder="0.000000"
                                />
                              </div>
                              <div>
                                <label className="font-body text-sm text-cream-muted mb-2 block">
                                  Valor kWh (€/kWh)
                                </label>
                                <input
                                  type="number"
                                  step="0.000001"
                                  value={tarifas.gas?.escaloes?.[escalao]?.valor_kwh ?? ''}
                                  onChange={(e) => setTarifas({
                                    ...tarifas,
                                    gas: {
                                      ...tarifas.gas!,
                                      escaloes: {
                                        ...tarifas.gas!.escaloes,
                                        [escalao]: {
                                          ...tarifas.gas!.escaloes[escalao],
                                          valor_kwh: e.target.value === '' ? '' as any : parseFloat(e.target.value)
                                        }
                                      }
                                    }
                                  })}
                                  className="w-full px-4 py-2 bg-background border border-border rounded-lg font-body text-foreground focus:outline-none focus:ring-2 focus:ring-gold/50"
                                  placeholder="0.000000"
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </TabsContent>
                )}
              </Tabs>
            )}

            <div className="flex items-center gap-2">
              <Checkbox
                id="ativa"
                checked={formData.ativa}
                onCheckedChange={(checked) => setFormData({ ...formData, ativa: checked as boolean })}
              />
              <label htmlFor="ativa" className="font-body text-sm text-cream-muted cursor-pointer">
                Operadora ativa
              </label>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-border">
              <button
                type="button"
                onClick={() => setShowDialog(false)}
                disabled={submitting}
                className="px-6 py-2 border border-border rounded-lg font-body text-cream-muted hover:text-foreground transition-all disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2 bg-gold text-primary-foreground rounded-lg font-body hover:bg-gold-light transition-all disabled:opacity-50 flex items-center gap-2"
              >
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                {editingId ? 'Atualizar' : 'Criar'}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OperadorasManager;
