import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

interface PrivacyPolicyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const PrivacyPolicyDialog = ({ open, onOpenChange }: PrivacyPolicyDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] p-0">
        <DialogHeader className="px-6 pt-6">
          <DialogTitle className="font-display text-2xl text-foreground">
            Política de Privacidade
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-[60vh] px-6 pb-6">
          <div className="space-y-4 font-body text-cream-muted">
            <section>
              <h3 className="font-display text-lg text-foreground mb-2">1. Informações que Recolhemos</h3>
              <p className="leading-relaxed">
                O MPgrupo recolhe informações pessoais quando você nos contacta através dos nossos formulários, telefone ou email.
                Estas informações podem incluir nome, email, número de telefone e outras informações relevantes para prestar os nossos serviços.
              </p>
            </section>

            <section>
              <h3 className="font-display text-lg text-foreground mb-2">2. Como Utilizamos as Suas Informações</h3>
              <p className="leading-relaxed mb-2">
                Utilizamos as suas informações pessoais para:
              </p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Responder às suas solicitações e pedidos de informação</li>
                <li>Fornecer os serviços solicitados</li>
                <li>Melhorar a qualidade dos nossos serviços</li>
                <li>Comunicar promoções e novidades (com o seu consentimento)</li>
              </ul>
            </section>

            <section>
              <h3 className="font-display text-lg text-foreground mb-2">3. Proteção de Dados</h3>
              <p className="leading-relaxed">
                Implementamos medidas de segurança adequadas para proteger as suas informações pessoais contra acesso não autorizado,
                alteração, divulgação ou destruição. Os seus dados são armazenados em servidores seguros e apenas pessoal autorizado tem acesso aos mesmos.
              </p>
            </section>

            <section>
              <h3 className="font-display text-lg text-foreground mb-2">4. Partilha de Informações</h3>
              <p className="leading-relaxed">
                Não vendemos, alugamos ou partilhamos as suas informações pessoais com terceiros, exceto quando necessário para
                fornecer os serviços solicitados ou quando exigido por lei.
              </p>
            </section>

            <section>
              <h3 className="font-display text-lg text-foreground mb-2">5. Os Seus Direitos</h3>
              <p className="leading-relaxed mb-2">
                Você tem o direito de:
              </p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Aceder às suas informações pessoais</li>
                <li>Corrigir informações incorretas ou desatualizadas</li>
                <li>Solicitar a eliminação dos seus dados</li>
                <li>Retirar o consentimento para comunicações de marketing</li>
              </ul>
            </section>

            <section>
              <h3 className="font-display text-lg text-foreground mb-2">6. Cookies</h3>
              <p className="leading-relaxed">
                Utilizamos cookies para melhorar a sua experiência no nosso website. Para mais informações, consulte a nossa Política de Cookies.
              </p>
            </section>

            <section>
              <h3 className="font-display text-lg text-foreground mb-2">7. Contacto</h3>
              <p className="leading-relaxed">
                Para questões relacionadas com a privacidade dos seus dados, contacte-nos através de info@mpgrupo.pt ou +351 912 345 678.
              </p>
            </section>

            <section>
              <h3 className="font-display text-lg text-foreground mb-2">8. Alterações</h3>
              <p className="leading-relaxed">
                Esta política pode ser atualizada periodicamente. A última atualização foi em Janeiro de 2026.
              </p>
            </section>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default PrivacyPolicyDialog;
