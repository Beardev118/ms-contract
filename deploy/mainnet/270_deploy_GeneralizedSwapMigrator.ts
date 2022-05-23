import { DeployFunction } from "hardhat-deploy/types"
import { HardhatRuntimeEnvironment } from "hardhat/types"
import { ethers } from "hardhat"
import { GeneralizedSwapMigrator } from "../../build/typechain"
import { MULTISIG_ADDRESS } from "../../utils/accounts"
import { CHAIN_ID } from "../../utils/network"

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts, getChainId } = hre
  const { execute, deploy, get, getOrNull, log, save } = deployments
  const { deployer } = await getNamedAccounts()

  // Manually check if the pool is already deployed
  const genSwapMigrator = await getOrNull("GeneralizedSwapMigrator")
  if (genSwapMigrator) {
    log(`reusing "GeneralizedSwapMigrator" at ${genSwapMigrator.address}`)
  } else {
    await deploy("GeneralizedSwapMigrator", {
      from: deployer,
      log: true,
    })

    const contract: GeneralizedSwapMigrator = await ethers.getContract(
      "GeneralizedSwapMigrator",
    )
    const batchCall = [
      await contract.populateTransaction.addMigrationData(
        (
          await get("metalUSDPool")
        ).address,
        {
          newPoolAddress: (await get("metalUSDPoolV2")).address,
          oldPoolLPTokenAddress: (await get("metalUSDPoolLPToken")).address,
          newPoolLPTokenAddress: (await get("metalUSDPoolV2LPToken")).address,
          tokens: [
            (await get("DAI")).address,
            (await get("USDC")).address,
            (await get("USDT")).address,
          ],
        },
        false,
      ),
      await contract.populateTransaction.addMigrationData(
        (
          await get("metalSUSDMetaPool")
        ).address,
        {
          newPoolAddress: (await get("metalSUSDMetaPoolUpdated")).address,
          oldPoolLPTokenAddress: (
            await get("metalSUSDMetaPoolLPToken")
          ).address,
          newPoolLPTokenAddress: (
            await get("metalSUSDMetaPoolUpdatedLPToken")
          ).address,
          tokens: [
            (await get("SUSD")).address,
            (await get("metalUSDPoolV2LPToken")).address,
          ],
        },
        false,
      ),
      await contract.populateTransaction.addMigrationData(
        (
          await get("metalTBTCMetaPool")
        ).address,
        {
          newPoolAddress: (await get("metalTBTCMetaPoolUpdated")).address,
          oldPoolLPTokenAddress: (
            await get("metalTBTCMetaPoolLPToken")
          ).address,
          newPoolLPTokenAddress: (
            await get("metalTBTCMetaPoolUpdatedLPToken")
          ).address,
          tokens: [
            (await get("TBTCv2")).address,
            (await get("metalBTCPoolV2LPToken")).address,
          ],
        },
        false,
      ),
      await contract.populateTransaction.addMigrationData(
        (
          await get("metalWCUSDMetaPool")
        ).address,
        {
          newPoolAddress: (await get("metalWCUSDMetaPoolUpdated")).address,
          oldPoolLPTokenAddress: (
            await get("metalWCUSDMetaPoolLPToken")
          ).address,
          newPoolLPTokenAddress: (
            await get("metalWCUSDMetaPoolUpdatedLPToken")
          ).address,
          tokens: [
            (await get("WCUSD")).address,
            (await get("metalUSDPoolV2LPToken")).address,
          ],
        },
        false,
      ),
    ]

    if ((await getChainId()) == CHAIN_ID.MAINNET) {
      batchCall.push(
        await contract.populateTransaction.transferOwnership(MULTISIG_ADDRESS),
      )
    }

    const batchCallData = batchCall
      .map((x) => x.data)
      .filter((x): x is string => !!x)

    await execute(
      "GeneralizedSwapMigrator",
      {
        from: deployer,
        log: true,
      },
      "batch",
      batchCallData,
      true,
    )
  }
}
export default func
func.tags = ["GeneralizedSwapMigrator"]
func.dependencies = ["WCUSDMetaPoolTokens", "WCUSDMetaPoolUpdated"]
