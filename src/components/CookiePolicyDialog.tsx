import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

interface CookiePolicyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CookiePolicyDialog = ({ open, onOpenChange }: CookiePolicyDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] p-0">
        <DialogHeader className="px-6 pt-6">
          <DialogTitle className="font-display text-2xl text-foreground">
            Política de Cookies
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-[60vh] px-6 pb-6">
          <div className="space-y-4 font-body text-cream-muted">
            <section>
              <h3 className="font-display text-lg text-foreground mb-2">1. O que são Cookies</h3>
              <p className="leading-relaxed">
                Cookies são pequenos ficheiros de texto que são armazenados no seu dispositivo quando visita o nosso website.
                Eles ajudam-nos a fornecer uma melhor experiência de navegação e a entender como o website é utilizado.
              </p>
            </section>

            <section>
              <h3 className="font-display text-lg text-foreground mb-2">2. Tipos de Cookies que Utilizamos</h3>

              <div className="space-y-3 mt-3">
                <div>
                  <h4 className="font-display text-base text-foreground mb-1">Cookies Essenciais</h4>
                  <p className="leading-relaxed">
                    Necessários para o funcionamento básico do website. Estes cookies não podem ser desativados
                    pois são essenciais para a navegação e utilização das funcionalidades do site.
                  </p>
                </div>

                <div>
                  <h4 className="font-display text-base text-foreground mb-1">Cookies de Desempenho</h4>
                  <p className="leading-relaxed">
                    Recolhem informações sobre como os visitantes utilizam o website, como páginas mais visitadas
                    e mensagens de erro. Ajudam-nos a melhorar o funcionamento do website.
                  </p>
                </div>

                <div>
                  <h4 className="font-display text-base text-foreground mb-1">Cookies de Funcionalidade</h4>
                  <p className="leading-relaxed">
                    Permitem que o website se lembre de escolhas que faz (como idioma ou região) e forneçam
                    funcionalidades melhoradas e mais personalizadas.
                  </p>
                </div>

                <div>
                  <h4 className="font-display text-base text-foreground mb-1">Cookies de Marketing</h4>
                  <p className="leading-relaxed">
                    Utilizados para rastrear visitantes através de websites. A intenção é exibir anúncios
                    relevantes e envolventes para o utilizador individual.
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h3 className="font-display text-lg text-foreground mb-2">3. Duração dos Cookies</h3>
              <p className="leading-relaxed mb-2">
                Utilizamos dois tipos de cookies quanto à duração:
              </p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li><strong>Cookies de Sessão:</strong> Temporários, eliminados quando fecha o navegador</li>
                <li><strong>Cookies Persistentes:</strong> Permanecem no seu dispositivo por um período específico</li>
              </ul>
            </section>

            <section>
              <h3 className="font-display text-lg text-foreground mb-2">4. Cookies de Terceiros</h3>
              <p className="leading-relaxed">
                Alguns cookies podem ser colocados por serviços de terceiros que aparecem nas nossas páginas,
                como ferramentas de análise ou redes sociais. Não controlamos estes cookies.
              </p>
            </section>

            <section>
              <h3 className="font-display text-lg text-foreground mb-2">5. Como Gerir Cookies</h3>
              <p className="leading-relaxed mb-2">
                Você pode controlar e gerir cookies através das configurações do seu navegador. No entanto,
                desativar cookies pode afetar a funcionalidade do website.
              </p>
              <p className="leading-relaxed">
                A maioria dos navegadores permite:
              </p>
              <ul className="list-disc list-inside space-y-1 ml-4 mt-2">
                <li>Ver que cookies estão armazenados</li>
                <li>Bloquear todos os cookies</li>
                <li>Bloquear cookies de terceiros</li>
                <li>Eliminar cookies quando fechar o navegador</li>
                <li>Eliminar todos os cookies</li>
              </ul>
            </section>

            <section>
              <h3 className="font-display text-lg text-foreground mb-2">6. Consentimento</h3>
              <p className="leading-relaxed">
                Ao continuar a utilizar o nosso website, você consente a utilização de cookies de acordo com esta política.
                Você pode retirar o seu consentimento a qualquer momento através das configurações do navegador.
              </p>
            </section>

            <section>
              <h3 className="font-display text-lg text-foreground mb-2">7. Alterações à Política</h3>
              <p className="leading-relaxed">
                Podemos atualizar esta Política de Cookies periodicamente. Recomendamos que reveja esta página
                regularmente para estar informado sobre como utilizamos cookies.
              </p>
            </section>

            <section>
              <h3 className="font-display text-lg text-foreground mb-2">8. Contacto</h3>
              <p className="leading-relaxed">
                Para questões sobre a nossa utilização de cookies, contacte-nos através de info@mpgrupo.pt ou +351 912 345 678.
              </p>
            </section>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default CookiePolicyDialog;
