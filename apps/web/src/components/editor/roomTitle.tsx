import type { LanguageLogoProps } from "@rcode/icons/languages";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@rcode/ui/ui/input-group";
import { ChevronDown } from "lucide-react";
import { memo, useRef, useState, type ComponentType } from "react";

interface RoomTitleProps {
  value: string;
  logo?: ComponentType<LanguageLogoProps>;
  onValueCommit: (value: string) => void;
}

interface RoomTitleInputState {
  externalValue: string;
  inputValue: string;
  isFocused: boolean;
}

export const RoomTitle = memo(function RoomTitle(props: RoomTitleProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [inputState, setInputState] = useState<RoomTitleInputState>({
    externalValue: props.value,
    inputValue: props.value,
    isFocused: false,
  });
  const Logo = props.logo;

  if (props.value !== inputState.externalValue) {
    setInputState({
      externalValue: props.value,
      inputValue: inputState.isFocused === true ? inputState.inputValue : props.value,
      isFocused: inputState.isFocused,
    });
  }

  return (
    <InputGroup className="mx-auto h-6 w-fit min-w-0 gap-1 border-transparent bg-transparent shadow-none hover:border-border">
      {Logo === undefined ? null : (
        <InputGroupAddon align="inline-start" className="px-1.5 pr-0">
          <Logo className="h-4 w-4 shrink-0" />
        </InputGroupAddon>
      )}
      <InputGroupInput
        ref={inputRef}
        className="w-auto flex-none px-1 text-left text-xs font-medium placeholder:text-muted-foreground"
        style={{ fieldSizing: "content" }}
        placeholder="Room title..."
        value={inputState.inputValue}
        onChange={(event) => {
          const nextValue = event.currentTarget.value;

          setInputState((currentState) => ({
            ...currentState,
            inputValue: nextValue,
          }));
        }}
        onFocus={() => {
          setInputState((currentState) => ({ ...currentState, isFocused: true }));
        }}
        onBlur={(event) => {
          const nextValue = event.currentTarget.value;
          setInputState((currentState) => ({
            externalValue: currentState.externalValue,
            inputValue: nextValue,
            isFocused: false,
          }));

          if (nextValue !== inputState.externalValue) {
            props.onValueCommit(nextValue);
          }
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            inputRef.current?.blur();
          }
        }}
      />
      <InputGroupAddon
        align="inline-end"
        className="cursor-pointer pl-0 pr-1.5"
        onClick={() => {
          // TODO: wire up dropdown trigger
        }}
      >
        <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
      </InputGroupAddon>
    </InputGroup>
  );
});
