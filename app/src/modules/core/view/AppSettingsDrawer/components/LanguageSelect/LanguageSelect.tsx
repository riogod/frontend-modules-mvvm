import { FC, SyntheticEvent, useState } from 'react';
import { Observer } from 'mobx-react-lite';
import { useTranslation } from 'react-i18next';
import Typography from '@mui/material/Typography';
import Autocomplete from '@mui/material/Autocomplete';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';

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
            renderOption={(props, option) => (
              <Box
                component="li"
                sx={{ '& > img': { mr: 2, flexShrink: 0 } }}
                {...props}
              >
                {option}
              </Box>
            )}
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
