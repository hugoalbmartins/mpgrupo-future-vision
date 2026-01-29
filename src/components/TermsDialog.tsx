import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

interface TermsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const TermsDialog = ({ open, onOpenChange }: TermsDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] p-0">
        <DialogHeader className="px-6 pt-6">
          <DialogTitle className="font-display text-2xl text-foreground">
            Termos de Uso
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-[60vh] px-6 pb-6">
          <div className="space-y-4 font-body text-cream-muted">
            <section>
              <h3 className="font-display text-lg text-foreground mb-2">1. Aceitação dos Termos</h3>
              <p className="leading-relaxed">
                Ao aceder e utilizar o website do MPgrupo, você concorda em cumprir estes Termos de Uso.
                Se não concordar com algum destes termos, não utilize o nosso website.
              </p>
            </section>

            <section>
              <h3 className="font-display text-lg text-foreground mb-2">2. Utilização do Website</h3>
              <p className="leading-relaxed mb-2">
                O nosso website destina-se a fornecer informações sobre os nossos serviços. Você concorda em:
              </p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Utilizar o website apenas para fins legais</li>
                <li>Não tentar aceder a áreas restritas do website</li>
                <li>Não transmitir vírus ou código malicioso</li>
                <li>Não copiar ou reproduzir conteúdo sem autorização</li>
              </ul>
            </section>

            <section>
              <h3 className="font-display text-lg text-foreground mb-2">3. Propriedade Intelectual</h3>
              <p className="leading-relaxed">
                Todo o conteúdo do website, incluindo textos, gráficos, logótipos e imagens, é propriedade do MPgrupo
                ou dos seus licenciadores e está protegido por leis de direitos de autor.
              </p>
            </section>

            <section>
              <h3 className="font-display text-lg text-foreground mb-2">4. Serviços</h3>
              <p className="leading-relaxed">
                As informações sobre os nossos serviços são fornecidas de boa-fé. Reservamo-nos o direito de
                modificar, suspender ou descontinuar qualquer serviço a qualquer momento sem aviso prévio.
              </p>
            </section>

            <section>
              <h3 className="font-display text-lg text-foreground mb-2">5. Links Externos</h3>
              <p className="leading-relaxed">
                O nosso website pode conter links para websites de terceiros. Não somos responsáveis pelo conteúdo
                ou práticas de privacidade desses websites externos.
              </p>
            </section>

            <section>
              <h3 className="font-display text-lg text-foreground mb-2">6. Limitação de Responsabilidade</h3>
              <p className="leading-relaxed">
                O MPgrupo não se responsabiliza por quaisquer danos diretos, indiretos, incidentais ou consequenciais
                resultantes da utilização ou impossibilidade de utilização do website.
              </p>
            </section>

            <section>
              <h3 className="font-display text-lg text-foreground mb-2">7. Informações de Contacto</h3>
              <p className="leading-relaxed">
                As informações de contacto fornecidas através do formulário ou outros meios serão tratadas de acordo
                com a nossa Política de Privacidade.
              </p>
            </section>

            <section>
              <h3 className="font-display text-lg text-foreground mb-2">8. Alterações aos Termos</h3>
              <p className="leading-relaxed">
                Reservamo-nos o direito de modificar estes termos a qualquer momento. As alterações entrarão em vigor
                imediatamente após a sua publicação no website.
              </p>
            </section>

            <section>
              <h3 className="font-display text-lg text-foreground mb-2">9. Lei Aplicável</h3>
              <p className="leading-relaxed">
                Estes Termos de Uso são regidos pelas leis portuguesas. Qualquer disputa será resolvida nos tribunais competentes de Portugal.
              </p>
            </section>

            <section>
              <h3 className="font-display text-lg text-foreground mb-2">10. Contacto</h3>
              <p className="leading-relaxed">
                Para questões sobre estes Termos de Uso, contacte-nos através de info@mpgrupo.pt ou +351 912 345 678.
              </p>
            </section>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default TermsDialog;
