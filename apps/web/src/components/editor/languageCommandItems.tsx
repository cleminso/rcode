import { languages, type Language } from "@rcode/icons/languages";
import { CommandItem } from "@rcode/ui/command";

interface LanguageCommandItemsProps {
  currentValue: string;
  onSelect: (language: Language) => void;
}

export function LanguageCommandItems(props: LanguageCommandItemsProps) {
  return languages.map((language) => {
    const Logo = language.logo;
    const isCurrent = language.value === props.currentValue;
    const keywords = "keywords" in language ? language.keywords : [];

    return (
      <CommandItem
        key={language.value}
        value={language.name}
        keywords={[language.value, ...keywords]}
        indicator={isCurrent === true ? "current" : "none"}
        aria-current={isCurrent === true ? "true" : undefined}
        onSelect={() => props.onSelect(language)}
      >
        {Logo !== undefined ? <Logo className="size-5" /> : null}
        <span>{language.name}</span>
      </CommandItem>
    );
  });
}
