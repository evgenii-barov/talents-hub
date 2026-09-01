import { LegalDocument, LegalSection, OperatorDetails } from "@/components/legal/legal-document";
import { legalOperator } from "@/lib/legal";
import { buildPageMetadata } from "@/lib/seo";

export const metadata = buildPageMetadata({
  title: "Владелец сайта и оператор персональных данных",
  description: "Сведения о владельце talents-hub.online и операторе персональных данных.",
  path: "/legal/owner",
});

export default function OwnerPage() {
  return (
    <LegalDocument
      title="Сведения о владельце сайта и операторе персональных данных"
      summary="Обязательные сведения о лице, определяющем работу talents-hub.online и цели обработки персональных данных."
    >
      <LegalSection title="1. Владелец сайта и оператор">
        <p>{legalOperator.fullName} является владельцем сайта talents-hub.online, администратором платформы Talents Hub и оператором персональных данных пользователей сайта.</p>
        <OperatorDetails />
      </LegalSection>
      <LegalSection title="2. Обращения">
        <p>Юридически значимые сообщения направляются по адресу {legalOperator.legalEmail} или по почтовому адресу {legalOperator.postalAddress}.</p>
        <p>Запросы субъектов персональных данных и отзывы согласий направляются на {legalOperator.privacyEmail}. Жалобы на материалы и решения модерации — на {legalOperator.moderationEmail}.</p>
      </LegalSection>
    </LegalDocument>
  );
}
