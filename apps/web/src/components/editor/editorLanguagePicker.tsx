import { getLanguage, type Language } from "@rcode/icons/languages";
import Button from "@rcode/ui/button";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandList,
} from "@rcode/ui/command";
import { memo, useRef } from "react";
import { LanguageCommandItems } from "./languageCommandItems";

interface EditorLanguageComboboxProps {
  open: boolean;
  value: string;
  onOpenChange: (open: boolean) => void;
  onValueChange: (value: string) => void;
}

export const EditorLanguageCombobox = memo(function EditorLanguageCombobox(props: EditorLanguageComboboxProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const selectedLanguage = getLanguage(props.value);

  const selectLanguage = (language: Language) => {
    props.onValueChange(language.value);
    props.onOpenChange(false);
  };

  return (
    <div className="flexrow-2">
      <Button variant="ghost" onClick={() => {
        props.onOpenChange(true);
      }}>
        <span>{selectedLanguage.name}</span>
      </Button>

      <CommandDialog
        open={props.open}
        initialFocus={() => inputRef.current}
        onOpenChange={props.onOpenChange}
        title="Select editor language"
        description="Search available editor languages."
        className="top-14 sm:max-w-126"
      >
        <Command loop>
          <CommandInput ref={inputRef} placeholder="Select a language..." />
          <CommandList className="max-h-90">
            <CommandEmpty>No languages found.</CommandEmpty>
            <CommandGroup>
              <LanguageCommandItems currentValue={selectedLanguage.value} onSelect={selectLanguage} />
            </CommandGroup>
          </CommandList>
        </Command>
      </CommandDialog>
    </div>
  );
});
