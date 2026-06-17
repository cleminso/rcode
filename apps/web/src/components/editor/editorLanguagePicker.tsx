import { getLanguage, languages, type Language } from "@rcode/icons/languages";
import Button from "@rcode/ui/button";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@rcode/ui/command";
import { memo, useState } from "react";

interface EditorLanguageComboboxProps {
  value: string;
  onValueChange: (value: string) => void;
}

export const EditorLanguageCombobox = memo(function EditorLanguageCombobox(props: EditorLanguageComboboxProps) {
  const [open, setOpen] = useState(false);
  const selectedLanguage = getLanguage(props.value);

  const selectLanguage = (language: Language) => {
    props.onValueChange(language.value);
    setOpen(false);
  };

  return (
    <div className="flex items-center gap-2">
      <Button variant="ghost" onClick={() => {
        setOpen(true);
      }}>
        <span>[L]</span>
        <span>{selectedLanguage.name}</span>
      </Button>

      <CommandDialog
        open={open}
        onOpenChange={setOpen}
        title="Select editor language"
        description="Search available editor languages."
        className="top-14 sm:max-w-126"
      >
        <Command loop>
          <CommandInput placeholder="Select a language..." />
          <CommandList className="max-h-90">
            <CommandEmpty>No languages found.</CommandEmpty>
            <CommandGroup>
              {languages.map((language) => {
                const Logo = language.logo;
                const isCurrent = language.value === selectedLanguage.value;
                const keywords = "keywords" in language ? language.keywords : [];

                return (
                  <CommandItem
                    key={language.value}
                    value={language.name}
                    keywords={[language.value, ...keywords]}
                    indicator={isCurrent === true ? "current" : "none"}
                    aria-current={isCurrent === true ? "true" : undefined}
                    onSelect={() => {
                      selectLanguage(language);
                    }}
                  >
                    {Logo !== undefined ? <Logo className="size-5" /> : null}
                    <span>{language.name}</span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </CommandDialog>
    </div>
  );
});
