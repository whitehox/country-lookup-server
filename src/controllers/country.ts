import { Request, Response } from 'express';
import httpStatus from 'http-status';
import { CountryType, ConvertCurrencyType } from '../types/country';
import { ResponseInterface } from '../types/response';
import getCountryRequest from '../helpers/getCountryRequest';
import getCurrencyRequest from '../helpers/getCurrencyRequest';
import convertCurrencyToSEK from '../helpers/convertCurrencyToSEK';

export const getCountry = async (
  req: Request,
  res: Response,
): Promise<ResponseInterface | void> => {
  try {
    const { country } = req.params as CountryType;

    const countryDataRequest = getCountryRequest(
      `${process.env.COUNTRY_API}/name/${country}?fields=name;currencies;population`,
    );

    const currencyRatesRequest = getCurrencyRequest(
      `${process.env.FIXER_API}/latest?access_key=${process.env.FIXER_ACCESS_KEY}`,
    );

    const [countryData, currencyRates] = await Promise.all([
      countryDataRequest,
      currencyRatesRequest,
    ]);

    const payload = countryData.map((country) => {
      let countryCurrencyToSEK: unknown;
      if (country.currencies[0]?.code! === 'EUR') {
        countryCurrencyToSEK = currencyRates.rates['SEK'];
      } else {
        countryCurrencyToSEK = convertCurrencyToSEK(
          country.currencies[0]?.code!,
          'SEK',
          currencyRates.rates,
        );
      }

      let result = { ...country, currencyToSEK: countryCurrencyToSEK };

      return result;
    });

    return res.status(httpStatus.OK).json({ payload });
  } catch (error) {
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      message: 'Cannot get country details at this time',
      error: error.message,
    });
  }
};

export const convertCurrency = async (
  req: Request,
  res: Response,
): Promise<ResponseInterface | void> => {
  try {
    const { code, amount, convertToCode } = req.body as ConvertCurrencyType;

    const currencyRatesRequest = await getCurrencyRequest(
      `${process.env.FIXER_API}/latest?access_key=${process.env.FIXER_ACCESS_KEY}`,
    );

    const currency =
      convertCurrencyToSEK(code, convertToCode, currencyRatesRequest.rates) *
      amount;

    return res.status(httpStatus.OK).json({ conversion: currency });
  } catch (error) {
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      message: 'Cannot convert currency at this time',
      error: error.message,
    });
  }
};
