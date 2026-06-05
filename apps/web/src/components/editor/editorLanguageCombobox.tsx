import { languages } from "@rcode/icons/languages";
import { Button } from "@rcode/ui/ui/button";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxTrigger,
  ComboboxValue,
} from "@rcode/ui/ui/combobox";
import { memo } from "react";

type LanguageOption = {
  value: string;
  label: string;
  keywords?: readonly string[];
};

const languageOptions = languages.map((language) => ({
  value: language.value,
  label: language.name,
  keywords: "keywords" in language ? language.keywords : undefined,
}));

const defaultLanguageOption: LanguageOption = {
  value: "plaintext",
  label: "Plain text",
};

interface EditorLanguageComboboxProps {
  value: string;
  onValueChange: (value: string) => void;
}

export const EditorLanguageCombobox = memo(function EditorLanguageCombobox(props: EditorLanguageComboboxProps) {
  const selectedLanguage = languageOptions.find((language) => language.value === props.value) ?? defaultLanguageOption;

  return (
    <div className="flex items-center gap-2">
      <Combobox
        items={languageOptions}
        value={selectedLanguage}
        onValueChange={(nextLanguage: LanguageOption | null) => {
          if (nextLanguage === null) return;
          props.onValueChange(nextLanguage.value);
        }}
        itemToStringLabel={(language: LanguageOption) => language.label}
        itemToStringValue={(language: LanguageOption) =>
          [language.label, language.value, ...(language.keywords ?? [])].join(" ")
        }
        isItemEqualToValue={(item: LanguageOption, currentValue: LanguageOption) => item.value === currentValue.value}
        autoHighlight
      >
        <ComboboxTrigger
          render={<Button type="button" variant="secondary" size="sm" className="w-36 justify-between font-normal" />}
        >
          <ComboboxValue>{selectedLanguage.label}</ComboboxValue>
        </ComboboxTrigger>
        <ComboboxContent className="min-w-52">
          <ComboboxInput showTrigger={false} placeholder="Search language" />
          <ComboboxEmpty>No languages found.</ComboboxEmpty>
          <ComboboxList>
            {(language: LanguageOption) => (
              <ComboboxItem key={language.value} value={language}>
                {language.label}
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
    </div>
  );
});
