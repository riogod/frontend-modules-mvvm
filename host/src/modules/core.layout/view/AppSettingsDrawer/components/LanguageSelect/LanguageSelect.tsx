import { type FC, type SyntheticEvent, useState } from 'react';
import { Observer } from 'mobx-react-lite';
import { useTranslation } from 'react-i18next';
import { Typography, Autocomplete, Box, TextField } from '@todo/ui';

const LanguageSelect: FC = () => {
  const { t, i18n } = useTranslation('common');

  const [selectedLanguage, setSelectedLanguage] = useState<string>(
    i18n.language,
  );

  const handleLanguageChange = (
    _event: SyntheticEvent<Element, Event>,
    newValue: string | null,
  ) => {
    void (async () => {
      if (newValue) {
        setSelectedLanguage(newValue);
        await i18n.changeLanguage(newValue);
      }
    })();
  };

  return (
    <Observer>
      {() => (
        <>
          <Typography variant="subtitle2" color="text.secondary">
            {t('settings.LANGUAGE.select.language')}
          </Typography>
          <Autocomplete
            id="select-language"
            options={['en', 'ru']}
            autoHighlight
            value={selectedLanguage}
            disableClearable
            onChange={handleLanguageChange}
            getOptionLabel={(option) => option}
            renderOption={(props, option) => {
              // eslint-disable-next-line react/prop-types
              const { key, ...otherProps } = props;
              return (
                <Box
                  {...otherProps}
                  key={key}
                  component="li"
                  sx={{ '& > img': { mr: 2, flexShrink: 0 } }}
                >
                  {option}
                </Box>
              );
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                variant="standard"
                inputProps={{
                  ...params.inputProps,
                }}
              />
            )}
          />
        </>
      )}
    </Observer>
  );
};

export default LanguageSelect;
